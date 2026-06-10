$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardUrl = 'http://localhost:5173/'
$startupTimeoutSeconds = 90

function Test-DashboardReady {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

Set-Location $projectRoot

if (Test-DashboardReady -Url $dashboardUrl) {
  Start-Process $dashboardUrl
  Write-Host "Dashboard is already running: $dashboardUrl"
  exit 0
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error 'npm was not found. Install Node.js first.'
}

$escapedRoot = $projectRoot.Replace("'", "''")
$command = @"
Set-Location '$escapedRoot'
if (-not (Test-Path 'node_modules')) {
  npm install
}
npm run dev
"@

Start-Process powershell.exe -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy', 'Bypass',
  '-Command', $command
) | Out-Null

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
while ($stopwatch.Elapsed.TotalSeconds -lt $startupTimeoutSeconds) {
  Start-Sleep -Seconds 2
  if (Test-DashboardReady -Url $dashboardUrl) {
    Start-Process $dashboardUrl
    Write-Host "Dashboard started: $dashboardUrl"
    exit 0
  }
}

Write-Warning "The dashboard process was started, but $dashboardUrl did not respond within $startupTimeoutSeconds seconds."
Write-Host 'Check the newly opened terminal window for startup errors.'
