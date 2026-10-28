$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$pm2Path = Join-Path $env:APPDATA 'npm/node_modules/pm2/bin/pm2'
if (-not (Test-Path -LiteralPath $pm2Path)) { throw 'Install PM2 first: npm install -g pm2' }
$startScript = Join-Path $PSScriptRoot 'start-windows.ps1'
$powershellPath = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
function Quote-PowerShell([string]$value) { return "'" + $value.Replace("'", "''") + "'" }
$command = '& ' + (Quote-PowerShell $startScript) + ' -NodePath ' + (Quote-PowerShell $nodePath) + ' -Pm2Path ' + (Quote-PowerShell $pm2Path)
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
$startupFile = Join-Path ([Environment]::GetFolderPath('Startup')) 'EasyTyping.vbs'
# WScript launches PowerShell hidden, independent of PATH and execution policy.
$launcher = 'CreateObject("WScript.Shell").Run """' + $powershellPath + '"" -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ' + $encoded + '", 0, False'
Set-Content -LiteralPath $startupFile -Value $launcher -Encoding ASCII
Write-Output "Installed login startup: $startupFile"
Write-Output "Logs: $env:LOCALAPPDATA\EasyTyping\logs\startup.log"
Write-Output 'Laragon must also start MySQL at login. Remove EasyTyping.vbs to disable startup.'
