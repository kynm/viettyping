$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Log = Join-Path $Root 'storage\audit.log'

try {
    Push-Location $Root
    & node (Join-Path $Root 'scripts\audit.mjs') *>> $Log
    if ($LASTEXITCODE -ne 0) { throw "SEO audit exited with code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
