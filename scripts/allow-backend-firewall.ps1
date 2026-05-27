# Run PowerShell as Administrator, then:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\scripts\allow-backend-firewall.ps1

$ErrorActionPreference = 'Stop'

function Get-WifiLanIpv4 {
  $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -match '^(192\.168\.|10\.)' -and
      $_.InterfaceAlias -match 'Wi-Fi|WLAN'
    } |
    Select-Object -First 1
  if ($wifi) { return $wifi.IPAddress }

  return (
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -match '^(192\.168\.|10\.)' } |
      Select-Object -First 1 -ExpandProperty IPAddress
  )
}

Write-Host 'Setting Wi-Fi to Private (allows LAN access to your PC)...' -ForegroundColor Cyan
$wifiProfile = Get-NetConnectionProfile -ErrorAction SilentlyContinue |
  Where-Object { $_.InterfaceAlias -match 'Wi-Fi|WLAN' } |
  Select-Object -First 1
if ($wifiProfile) {
  try {
    Set-NetConnectionProfile -InterfaceAlias $wifiProfile.InterfaceAlias -NetworkCategory Private
  } catch {
    Write-Host 'Could not set Wi-Fi to Private (run this script as Administrator).' -ForegroundColor Yellow
  }
} else {
  Write-Host 'No Wi-Fi profile found; skipping Private network setting.' -ForegroundColor Yellow
}

try {
$ruleName = 'StyleHair Backend TCP 3000'
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Firewall rule already exists: $ruleName"
} else {
  New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3000 `
    -Profile Private, Public | Out-Null
  Write-Host "Created firewall rule: $ruleName" -ForegroundColor Green
}

$ip = Get-WifiLanIpv4
if (-not $ip) { $ip = 'YOUR_PC_IP' }

Write-Host ''
Write-Host "Done. On your phone browser open: http://${ip}:3000" -ForegroundColor Yellow
Write-Host 'If it loads, reopen StyleHair and tap Retry connection on login.'
} catch {
  Write-Host 'Could not create firewall rule (run this script as Administrator).' -ForegroundColor Yellow
  Write-Host "Still try on your phone: http://${ip}:3000" -ForegroundColor Yellow
}
