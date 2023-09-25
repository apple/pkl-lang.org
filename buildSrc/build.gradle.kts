plugins {
  `kotlin-dsl`
}

// IntelliJ doesn't currently understand statically typed access to the version catalog from this file.
// Hence we work around by using the dynamic API.
val libs = extensions.getByType<VersionCatalogsExtension>().named("libs")

dependencies {
  implementation(libs.findLibrary("jsoup").get())
}

java {
  sourceCompatibility = JavaVersion.VERSION_17
  targetCompatibility = JavaVersion.VERSION_17
}

repositories {
  mavenCentral()
}
