pluginManagement {
  repositories {
    maven {
      url = uri("https://artifacts.apple.com/plugins-release")
    }
  }
}

dependencyResolutionManagement {
  @Suppress("UnstableApiUsage")
  repositories {
    //repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    maven {
      url = uri("https://artifacts.apple.com/libs-release")
    }
  }
}

rootProject.name = "pkl.github.pie.apple.com"

val javaVersion = JavaVersion.current()
require(javaVersion.isCompatibleWith(JavaVersion.VERSION_11)) {
  "Project requires Java 11 or higher, but found ${javaVersion.majorVersion}."
}
