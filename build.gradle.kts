@file:Suppress("UnstableApiUsage")

import com.github.gradle.node.task.NodeTask

@Suppress("DSL_SCOPE_VIOLATION")
plugins {
  base
  idea
  validateSite
  alias(libs.plugins.downloadGradle)
  alias(libs.plugins.nodeGradle)
}

val isCi = System.getenv("CI") != null
val isDocker = System.getenv("DOCKER") != null

data class Site(
  /** The name of the repo to clone */
  val repo: String,
  /** The branch to clone */
  val branch: String,
  /**
   * The output directory.
   *
   * This will result in a subdirectory in the eventual deployment, e.g. pkl-lang.org/foo
   */
  val dirName: String = repo,
)

val additionalSites: List<Site> = listOf(
  Site("pkl-package-docs", "www", "package-docs"),
)

node {
  version.set(libs.versions.node)

  // Docker image has Node already installed for performance reasons
  download.set(true)
}

idea {
  module {
    excludeDirs = excludeDirs + files(".cache", ".gradle", ".idea", "build", "node_modules")
  }
}

val cloneAdditionalSites by tasks.registering {
  for (site in additionalSites) {
    outputs.dir(layout.buildDirectory.dir(site.dirName))
  }
  doLast {
    for (site in additionalSites) {
      exec {
        val output = layout.buildDirectory.dir(site.dirName).get()
        if (output.dir(".git").asFile.exists()) {
          commandLine(
            "git",
            "pull",
            "--ff-only",
            "origin",
            site.branch
          )
          workingDir(output)
        } else {
          commandLine(
            "git",
            "clone",
            "--branch",
            site.branch,
            "https://github.com/apple/${site.repo}.git",
            layout.buildDirectory.dir(site.dirName).get()
          )
        }
      }
    }
  }
}

val pklHtmlHighlighter by tasks.registering {
  inputs.dir("pkl-html-highlighter/src")
  inputs.dir("pkl-html-highlighter/queries")
  inputs.file("pkl-html-highlighter/Cargo.lock")
  inputs.file("pkl-html-highlighter/Cargo.toml")
  doFirst {
    exec {
      commandLine("cargo", "build")
      workingDir = file("pkl-html-highlighter")
    }
  }
  outputs.file("pkl-html-highlighter/target/debug/pkl-html-highlighter")
}

val buildLocalSite by tasks.registering(NodeTask::class) {
  dependsOn(pklHtmlHighlighter)
  dependsOn(tasks.named("npmInstall"))
  dependsOn(cloneAdditionalSites)

  val outputDir = file("${project.layout.buildDirectory.get()}/local")

  inputs.file("src/site-local.yml")
  inputs.dir("src/supplemental-ui")
  inputs.dir("src/highlighter")
  inputs.dir("src/macros")
  inputs.dir("../pkl/docs")
  inputs.dir("../pkl-spring/docs")
  inputs.dir("../pkl-intellij/docs")
  inputs.dir("../pkl-vscode/docs")
  inputs.dir("../pkl-neovim/docs")
  inputs.dir("../pkl-lsp/docs")
  inputs.dir("blog/")
  inputs.dir("landing/")

  outputs.dir(outputDir)

  // Allows us to load TypeScript sources directly; used for Asciidoctor syntax highlighting
  options.set(listOf("--require", "ts-node/register"))

  script.set(file("./node_modules/.bin/antora"))

  args.set(
    listOf(
      "--fetch",
      "--stacktrace",
      "src/site-local.yml",
    )
  )

  doFirst {
    execOverrides {
      environment["FORCE_COLOR"] = "1"
      environment["PKL_HTML_HIGHLIGHTER"] = pklHtmlHighlighter.get().outputs.files.first().absolutePath
    }
  }

  doLast {
    for (site in additionalSites) {
      copy {
        from(fileTree(layout.buildDirectory.dir(site.dirName).get()))
        into("$outputDir/${site.dirName}")
      }
    }
    println("\nGenerated local site at: file://$outputDir/index.html")
  }
}

val buildRemoteSite by tasks.registering(NodeTask::class) {
  dependsOn(pklHtmlHighlighter)
  dependsOn(cloneAdditionalSites)
  dependsOn(tasks.named("npmInstall"))

  val outputDir = project.layout.buildDirectory.get().dir("remote")

  inputs.file("src/site-remote.yml")
  inputs.dir("src/supplemental-ui")
  inputs.dir("src/highlighter")
  inputs.dir("src/macros")
  inputs.dir("blog/")
  inputs.dir("landing/")
  outputs.dir(outputDir)

  script.set(file("./node_modules/.bin/antora"))

  args.set(listOf(
      "--stacktrace",
      "src/site-remote.yml"
  ))

  // Allows us to load TypeScript sources directly; used for Asciidoctor syntax highlighting
  options.set(listOf("--require", "ts-node/register"))

  execOverrides {
    environment["PKL_HTML_HIGHLIGHTER"] = pklHtmlHighlighter.get().outputs.files.first().absolutePath

    val gitCredentials = System.getenv("ANTORA_GIT_FETCH")
    if (gitCredentials != null) {
      environment["GIT_CREDENTIALS"] = "https://${gitCredentials}:@github.com"
    }
  }

  doLast {
    for (site in additionalSites) {
      copy {
        from(fileTree(layout.buildDirectory.dir(site.dirName).get()))
        into(outputDir.dir(site.dirName))
      }
    }
    println("\nGenerated remote site at: file://${outputDir}/index.html")
  }
}

val publishRemoteSite by tasks.registering(Exec::class) {
  // important to run this as a self-contained CI step with GitHub deploy key,
  // hence no task dependency on `buildRemoteSite`

  executable = "bash"

  val dollar = "$"

  args(listOf(
      "-c",
      """
        set -ex

        BRANCH_NAME=$dollar(git symbolic-ref -q HEAD)
        BRANCH_NAME=$dollar{BRANCH_NAME##refs/heads/}
        git fetch origin +gh-pages:gh-pages
        git worktree add gh-pages gh-pages
        cd gh-pages

        rm -rf *
        touch .nojekyll
        echo "pkl-lang.org" > CNAME
        cp -r ../build/remote/* .
        git add * .nojekyll

        git config --global user.email "pkl-oss@group.apple.com"
        git config --global user.name "Pkl CI"
        git commit -m "Publish docsite [skip ci]"
        git push origin gh-pages

        cd ..
        rm -rf gh-pages
        git worktree prune
      """.trimIndent()
  ))
}

buildscript {
  repositories {
    mavenCentral()
  }
}

repositories {
  mavenCentral()
}
