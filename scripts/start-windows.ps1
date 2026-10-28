param(
    [string]$NodePath = (Get-Command node.exe -ErrorAction Stop).Source,
    [string]$Pm2Path = (Join-Path $env:APPDATA 'npm/node_modules/pm2/bin/pm2')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$logDirectory = Join-Path $env:LOCALAPPDATA 'EasyTyping/logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Start-Transcript -Path (Join-Path $logDirectory 'startup.log') -Append | Out-Null
try {
    if (-not (Test-Path -LiteralPath $NodePath)) { throw "Node missing: $NodePath" }
    if (-not (Test-Path -LiteralPath $Pm2Path)) { throw "PM2 missing: $Pm2Path" }
    if (-not (Test-Path -LiteralPath '.next/BUILD_ID')) { throw 'Production build missing. Run npm run deploy.' }
    # Use the same PM2 daemon as interactive deployment commands.
    if (-not $env:PM2_HOME) { $env:PM2_HOME = Join-Path $env:USERPROFILE '.pm2' }
    $env:PATH = "$(Split-Path $NodePath -Parent);$env:PATH"

    # Laragon starts MySQL at login too. Check a real query, not only an open port.
    $databaseReady = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        & $NodePath --env-file=.env (Join-Path $PSScriptRoot 'check-database.cjs')
        if ($LASTEXITCODE -eq 0) { $databaseReady = $true; break }
        Start-Sleep -Seconds 3
    }
    if (-not $databaseReady) { throw 'MySQL unavailable. Check Laragon and DATABASE_URL.' }

    # Use the current ecosystem config, never a stale dump or an npm.cmd interpreter.
    & $NodePath $Pm2Path start (Join-Path $projectRoot 'ecosystem.config.js') --only easytyping
    if ($LASTEXITCODE -ne 0) { throw 'PM2 failed to start EasyTyping.' }
    $healthy = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            $response = Invoke-WebRequest 'http://127.0.0.1:3000/login' -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200 -and $response.Content -match '<html') { $healthy = $true; break }
        } catch { Start-Sleep -Seconds 2 }
    }
    if (-not $healthy) { throw 'HTTP check failed. Inspect pm2 logs easytyping.' }
    & $NodePath $Pm2Path save
    if ($LASTEXITCODE -ne 0) { throw 'Cannot save PM2 state.' }
    Write-Output 'EasyTyping ready: http://localhost:3000'
} catch {
    Write-Output "Startup failed: $($_.Exception.Message)"
    exit 1
} finally {
    Stop-Transcript | Out-Null
}
