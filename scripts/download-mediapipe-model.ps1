$ErrorActionPreference = 'Stop'
$destDir = Join-Path $PSScriptRoot '..\assets\models'
$dest = Join-Path $destDir 'face_landmarker.task'
$url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Write-Host "Downloading MediaPipe face_landmarker.task..."
Invoke-WebRequest -Uri $url -OutFile $dest
Write-Host "Saved to $dest"
