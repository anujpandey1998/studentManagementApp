$ErrorActionPreference = 'Stop'
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
$dockerExecutable = if ($dockerCommand) { $dockerCommand.Source } else { 'C:\Program Files\Docker\Docker\resources\bin\docker.exe' }
if (-not (Test-Path -LiteralPath $dockerExecutable)) {
    throw 'Docker CLI is unavailable. Install and start Docker Desktop first.'
}
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$testFile = Join-Path $repositoryRoot 'supabase\tests\access.sql'
# Use psql inside the local database container; no host PostgreSQL install needed.
Get-Content -LiteralPath $testFile -Raw | & $dockerExecutable exec -i supabase_db_student-management psql -U postgres -d postgres -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) {
    throw 'Local backend permission/seed checks failed.'
}
Write-Output 'Local backend seed and permission checks passed.'
