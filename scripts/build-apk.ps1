# EAS prints upgrade notices to stderr; PowerShell treats that as a failing error.
$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..')

npx eas build -p android --profile preview --non-interactive
exit $LASTEXITCODE
