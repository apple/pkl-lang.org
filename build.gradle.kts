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

node {
  version.set(libs.versions.node)

  // Docker image has Node already installed for performance reasons
  download.set(!isDocker)

  if (isDocker) {
    // not sure why Docker image has `/usr/bin/node` but not `/usr/bin/npm`
    npmCommand.set("/usr/lib/node_modules/npm/bin/npm-cli.js")
    npmInstallCommand.set("ci")
  }
}

idea {
  module {
    excludeDirs = excludeDirs + files(".cache", ".gradle", ".idea", "build", "node_modules")
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

  val outputDir = file("$buildDir/local")

  inputs.file("src/site-local.yml")
  inputs.dir("src/supplemental-ui")
  inputs.dir("src/highlighter")
  inputs.dir("../pkl/docs")
  inputs.dir("../pkl-spring/docs")
  inputs.dir("../pkl-intellij/docs")
  inputs.dir("../pkl-vscode/docs")
  inputs.dir("../pkl-neovim/docs")
//  inputs.dir("../pkl-style-guide")
//  inputs.dir(downloadBinDir)

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
      // https://gitlab.com/antora/antora/issues/390
      environment["NODE_EXTRA_CA_CERTS"] =
        file("docker/files/apple_corporate_root_ca.pem").absolutePath
      environment["FORCE_COLOR"] = "1"
      environment["PKL_HTML_HIGHLIGHTER"] = pklHtmlHighlighter.get().outputs.files.first().absolutePath
    }
  }

  doLast {
    println("\nGenerated local site at: file://$outputDir/index.html")
  }
}

val buildRemoteSite by tasks.registering(NodeTask::class) {
  dependsOn(pklHtmlHighlighter)
  dependsOn(tasks.named("npmInstall"))

  val outputDir = file("$buildDir/remote")

  inputs.file("src/site-remote.yml")
  inputs.dir("src/supplemental-ui")
  inputs.dir("src/highlighter")
  outputs.dir(outputDir)

  script.set(file("./node_modules/.bin/antora"))

  args.set(listOf(
      "--stacktrace",
      "src/site-remote.yml"
  ))

  // Allows us to load TypeScript sources directly; used for Asciidoctor syntax highlighting
  options.set(listOf("--require", "ts-node/register"))

  execOverrides {
    // https://gitlab.com/antora/antora/issues/390
    environment["NODE_EXTRA_CA_CERTS"] = file("docker/files/apple_corporate_root_ca.pem").absolutePath
    environment["PKL_HTML_HIGHLIGHTER"] = pklHtmlHighlighter.get().outputs.files.first().absolutePath

    if (isCi) {
      environment["GIT_CREDENTIALS"] = "https://${file(System.getProperty("antoraKeyPath")).readText()}:@github.pie.apple.com"
    }
  }

  doLast {
    println("\nGenerated remote site at: file://$outputDir/index.html")
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
        set -x
  
        BRANCH_NAME=$dollar(git symbolic-ref -q HEAD)
        BRANCH_NAME=$dollar{BRANCH_NAME##refs/heads/}
        GIT_AUTHOR=$dollar(git --no-pager show -s --format='%an <%ae>' HEAD)
        git fetch origin +main:main
        git worktree add main main
        cd main
  
        rm -rf *
        touch .nojekyll
        cp -r ../build/remote/* .
        git add * .nojekyll
  
        git commit --author="${dollar}GIT_AUTHOR" -m "Publish docsite"
        git push origin main
  
        cd ..
        rm -rf main
        git worktree prune
      """.trimIndent()
  ))
}
