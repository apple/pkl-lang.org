@file:Suppress("UnnecessaryVariable", "UnstableApiUsage")

import java.util.concurrent.TimeUnit
import org.jsoup.Jsoup
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URISyntaxException
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.Executors

// links that are allowed to be http rather than https
val httpLinks = listOf<String>()

// links to exclude from validation (for example because they require authentication)
val excludedLinks = listOf(
    "https://www.oracle.com/technetwork/java",
)

configurations {
  register("nuValidator")
}

dependencies {
  val libs = project.extensions.getByType<VersionCatalogsExtension>().named("libs")

  "nuValidator"(libs.findLibrary("nuValidator").get()) {
    exclude(group = "javax.servlet")
    exclude(group = "commons-fileupload")
  }
}

for (location in listOf("local", "remote")) {
  val capitalizedLocation = location.capitalize()
  val htmlFiles = fileTree("$buildDir/$location").matching { include("**/*.html") }

  val buildSiteTask = "build${capitalizedLocation}Site" // defined in /build.gradle.kts
  val validateSiteTask = tasks.register("validate${capitalizedLocation}Site")
  val configureValidateHtmlFilesTask = tasks.register("configureValidate${capitalizedLocation}HtmlFiles")
  val validateHtmlFilesTask = tasks.register("validate${capitalizedLocation}HtmlFiles", JavaExec::class)
  val validateHtmlLinksTask = tasks.register("validate${capitalizedLocation}HtmlLinks")

  validateSiteTask.configure {
    dependsOn(validateHtmlFilesTask, validateHtmlLinksTask)
  }

  configureValidateHtmlFilesTask.configure {
    doLast {
      validateHtmlFilesTask.get().args(htmlFiles)
    }
  }

  validateHtmlFilesTask.configure {


    dependsOn(configureValidateHtmlFilesTask, buildSiteTask)

    val outputFile = file("$buildDir/report/validateHtmlFiles/result.txt")

    inputs.files(htmlFiles)
    outputs.file(outputFile)

    classpath = configurations["nuValidator"]
    mainClass.set("nu.validator.client.SimpleCommandLineValidator")
    args("--skip-non-html") // --also-check-css doesn't work (still checks css as html), so limit to html files
    args("--filterpattern", "(.*)Consider adding “lang=(.*)")
    args("--filterpattern", "(.*)The “main” role is unnecessary for element “main”(.*)")
    args("--filterpattern", "(.*)Consider adding a “lang” attribute(.*)")
    // for debugging
    // args("--verbose")

    // write a basic result file s.t. gradle can consider task up-to-date
    // writing a result file in case validation fails is not easily possible with JavaExec, but also not strictly necessary
    doFirst { delete(outputFile) }
    doLast { outputFile.writeText("Success.") }
  }

  validateHtmlLinksTask.configure {
    dependsOn(buildSiteTask)

    val outputDir = file("$buildDir/report/validateHtmlLinks")

    inputs.files(htmlFiles)
    outputs.dir(outputDir)

    doLast {
      val executor = Executors.newFixedThreadPool(10)
      val errors = ConcurrentLinkedQueue<String>()
      val seenLinks = mutableSetOf<String>()

      try {
			  // only validate links of latest version because we can't fix links of older versions
        for (htmlFile in htmlFiles) {
          val htmlText = htmlFile.readText()
          val unresolvedXrefs = Regex("""xref:\S*""").findAll(htmlText)
          for (xref in unresolvedXrefs) {
            errors.add("$htmlFile: Unresolved Antora xref: ${xref.value}")
          }
          val unresolvedTemplateExprs = Regex("""\{\{.*}}""").findAll(htmlText)
          for (expr in unresolvedTemplateExprs) {
            errors.add("$htmlFile: Unresolved Handlebars expression: ${expr.value}")
          }
          val htmlDoc = Jsoup.parse(htmlText, "UTF-8")
          val links = htmlDoc.select("a")
          for (link in links) {
            val href = link.attributes().get("href")

            if (excludedLinks.any { href.startsWith(it) }) continue

            // check each link just once
            if (!seenLinks.add(href)) continue

            val uri = try {
              URI(href)
            } catch (e: URISyntaxException) {
              errors.add("$htmlFile: Invalid link URL: $link (Error message: ${e.message})")
              continue
            }
            if (uri.scheme == null) {
              if (href == "" || href == "#") {
                val id = link.attributes().get("id")
                if (id.isEmpty()) errors.add("$htmlFile: Empty href in link: $link")
              } else if (uri.path != null && uri.path != "") {
                // TODO: check relative inter-document links
              } else {
                assert(uri.fragment != null)
                val linkTarget = htmlDoc.getElementById(uri.fragment)
                if (linkTarget == null) {
                  errors.add("$htmlFile: Dangling link: $link")
                }
              }
            } else if (uri.scheme == "mailto") {
              // not validated
            } else if (uri.scheme == "https" || uri.scheme == "http" && httpLinks.any { uri.toString().startsWith(it) }) {
              // capture values because variables will change while executor is running
              val submittedUri = uri
              val submittedHref = href
              val submittedHtmlFile = htmlFile

              executor.submit {
                // project.debug() can't be used from non-gradle thread (drops subsequent output)
                // so stick to println() for debugging
                // println("Validating external link `$submittedHref`.")

                val conn = submittedUri.toURL().openConnection() as HttpURLConnection
                conn.requestMethod = "HEAD"
                conn.instanceFollowRedirects = true
                try {
                  conn.connect()
                  val responseCode = conn.responseCode
                  if (responseCode != 200 &&
                      responseCode != 403 /* github auth */ &&
                      responseCode != 429 /* github rate limiting */) {
                    errors.add("$submittedHtmlFile: Unexpected HTTP status code `$responseCode` for external link `$submittedHref`.")
                  }
                } catch (e: IOException) {
                  println("Ignoring I/O error for external link `$submittedHref`. (Error message: ${e.message})")
                } finally {
                  conn.disconnect()
                }
              }
            } else if (uri.scheme == "file" && System.getProperty("releaseBuild") == null) {
              // file: links are allowed in dev builds
              val file = File(uri)
              if (!file.exists()) {
                errors.add("$htmlFile: Dangling link: $link")
              }
            } else {
              errors.add("$htmlFile: Unexpected URL protocol `${uri.scheme}` in: $link")
            }
          }
        }
      } finally {
        executor.shutdown()
        executor.awaitTermination(1, TimeUnit.MINUTES)
      }

      if (!errors.isEmpty()) {
        // failing the CI build is too harsh, especially as long as individual repos
        // don't run the same link checks during their builds
        if (System.getenv("CI") != null) {
          System.err.println(errors.joinToString("\n"))
        } else {
          throw GradleException(errors.joinToString("\n"))
        }
      } else {
        // gradle up-to-date check needs some file output
        outputDir.mkdirs()
      }
    }
  }
}
