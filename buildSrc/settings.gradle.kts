@file:Suppress("UnstableApiUsage")

pluginManagement {
  repositories {
    maven {
      url = uri("https://artifacts.apple.com/plugins-release")
    }
  }
}

dependencyResolutionManagement {
  // use same version catalog as main build
  versionCatalogs {
    register("libs") {
      from(files("../gradle/libs.versions.toml"))
    }
  }

  @Suppress("UnstableApiUsage")
  repositories {
    //repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    maven {
      url = uri("https://artifacts.apple.com/plugins-release")
    }
  }
}
