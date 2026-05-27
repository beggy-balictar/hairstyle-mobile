$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Test-Path 'android')) {
  npx expo prebuild -p android
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$sdk = $env:ANDROID_HOME
if (-not $sdk) {
  $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
if (-not (Test-Path $sdk)) {
  Write-Error 'Android SDK not found. Install Android Studio and set ANDROID_HOME.'
  exit 1
}

$localProps = Join-Path (Resolve-Path 'android') 'local.properties'
$sdkDir = ($sdk -replace '\\', '/')
Set-Content -Path $localProps -Value "sdk.dir=$($sdkDir -replace ':', '\:')`n" -Encoding ascii

$env:GRADLE_OPTS = '-Xmx4096m -Dorg.gradle.workers.max=2'
Push-Location android
try {
  .\gradlew.bat assembleRelease --no-daemon --no-parallel
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
