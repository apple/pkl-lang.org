rootProject.name = "pkl-lang.github.io"

val javaVersion = JavaVersion.current()
require(javaVersion.isCompatibleWith(JavaVersion.VERSION_11)) {
  "Project requires Java 11 or higher, but found ${javaVersion.majorVersion}."
}
