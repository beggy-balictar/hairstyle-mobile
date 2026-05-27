const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Replaces react-native-mediapipe's build.gradle with a clean version that:
 * - Removes the invalid project(':react-native-vision-camera') dependency
 * - Removes the outdated buildscript block (uses root project's AGP)
 * - Fixes indentation issues
 */
function withMediaPipeGradleFix(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const gradlePath = path.join(
        cfg.modRequest.projectRoot,
        'node_modules',
        'react-native-mediapipe',
        'android',
        'build.gradle',
      );
      if (!fs.existsSync(gradlePath)) return cfg;

      const fixed = `
def isNewArchitectureEnabled() {
  return rootProject.hasProperty("newArchEnabled") && rootProject.getProperty("newArchEnabled") == "true"
}

apply plugin: "com.android.library"
apply plugin: "kotlin-android"

if (isNewArchitectureEnabled()) {
  apply plugin: "com.facebook.react"
}

def reactNativeArchitectures() {
  def value = project.getProperties().get("reactNativeArchitectures")
  return value ? value.split(",") : ["armeabi-v7a", "x86", "x86_64", "arm64-v8a"]
}

def getExtOrDefault(name) {
  return rootProject.ext.has(name) ? rootProject.ext.get(name) : project.properties["Mediapipe_" + name]
}

def getExtOrIntegerDefault(name) {
  return rootProject.ext.has(name) ? rootProject.ext.get(name) : (project.properties["Mediapipe_" + name]).toInteger()
}

def supportsNamespace() {
  def parsed = com.android.Version.ANDROID_GRADLE_PLUGIN_VERSION.tokenize('.')
  def major = parsed[0].toInteger()
  def minor = parsed[1].toInteger()
  return (major == 7 && minor >= 3) || major >= 8
}

android {
  if (supportsNamespace()) {
    namespace "com.reactnativemediapipe"
    sourceSets {
      main {
        manifest.srcFile "src/main/AndroidManifestNew.xml"
      }
    }
  }

  buildFeatures {
    prefab true
  }

  ndkVersion getExtOrDefault("ndkVersion")
  compileSdkVersion getExtOrIntegerDefault("compileSdkVersion")

  defaultConfig {
    minSdkVersion getExtOrIntegerDefault("minSdkVersion")
    targetSdkVersion getExtOrIntegerDefault("targetSdkVersion")
  }

  buildTypes {
    release {
      minifyEnabled false
    }
  }

  lintOptions {
    disable "GradleCompatible"
  }

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
}

repositories {
  mavenCentral()
  google()
}

def kotlin_version = getExtOrDefault("kotlinVersion")

dependencies {
  implementation "com.facebook.react:react-native:+"
  implementation "org.jetbrains.kotlin:kotlin-stdlib:\${kotlin_version}"
  implementation 'com.google.mediapipe:tasks-vision:0.10.2'
  implementation 'androidx.camera:camera-core:1.3.3'
}
`.trimStart();

      fs.writeFileSync(gradlePath, fixed, 'utf8');
      return cfg;
    },
  ]);
}

module.exports = withMediaPipeGradleFix;
