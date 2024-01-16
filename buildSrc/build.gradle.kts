plugins {
  `kotlin-dsl`
}

// IntelliJ doesn't currently understand statically typed access to the version catalog from this file.
// Hence we work around by using the dynamic API.
val libs = extensions.getByType<VersionCatalogsExtension>().named("libs")

dependencies {
  implementation(libs.findLibrary("jsoup").get())
}

// https://youtrack.jetbrains.com/issue/KT-48745
// Setting both Java and Kotlin to 11 still runs into the above issue (in buildSrc).
java {
  sourceCompatibility = JavaVersion.VERSION_1_8
  targetCompatibility = JavaVersion.VERSION_1_8
}
