$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program $($Arguments -join ' ') failed ($LASTEXITCODE). Deployment stopped."
    }
}

Get-Command npm -ErrorAction Stop | Out-Null
Get-Command pm2 -ErrorAction Stop | Out-Null
if (-not (Test-Path -LiteralPath '.env')) { throw 'Missing .env with DATABASE_URL.' }
$conflicts = & git diff --name-only --diff-filter=U
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect Git merge state.' }
if ($conflicts) { throw "Resolve Git conflicts before deployment: $($conflicts -join ', ')" }

# Stop before replacing node_modules: a running Prisma client locks its Windows DLL.
$processes = (& pm2 jlist | Out-String | ConvertFrom-Json)
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect PM2 processes.' }
if ($processes | Where-Object { $_.name -eq 'easytyping' }) {
    Invoke-Checked 'pm2' @('stop', 'easytyping')
}
Invoke-Checked 'npm' @('ci')
Invoke-Checked 'npm' @('run', 'db:generate')
Invoke-Checked 'npm' @('run', 'clean')
Invoke-Checked 'npm' @('run', 'typecheck')
Invoke-Checked 'npm' @('run', 'lint')
Invoke-Checked 'npm' @('test', '--', '--runInBand')
Invoke-Checked 'npm' @('run', 'build')
Invoke-Checked 'npm' @('run', 'db:deploy')
Invoke-Checked 'pm2' @('startOrRestart', 'ecosystem.config.js', '--only', 'easytyping', '--update-env')

$healthy = $false
for ($attempt = 0; $attempt -lt 15; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/login' -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200 -and $response.Content -match '<html') {
            $healthy = $true
            break
        }
    } catch { Start-Sleep -Seconds 2 }
}
if (-not $healthy) { throw 'PM2 started, but HTTP health check failed. Inspect pm2 logs easytyping.' }
Invoke-Checked 'pm2' @('save')
Write-Host 'Deployment passed: build, migrations, PM2 and HTTP health check.'
