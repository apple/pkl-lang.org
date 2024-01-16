@file:Suppress("UnstableApiUsage")
dependencyResolutionManagement {
  // use same version catalog as main build
  versionCatalogs {
    register("libs") {
      from(files("../gradle/libs.versions.toml"))
    }
  }
}
