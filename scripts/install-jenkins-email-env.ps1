# Copy SMTP / EMAIL vars from repo .env → Jenkins job workspace .env (run on Jenkins build machine).
# Usage (on Jenkins server, as admin):
#   powershell -ExecutionPolicy Bypass -File scripts\install-jenkins-email-env.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\install-jenkins-email-env.ps1 -Workspace "C:\ProgramData\Jenkins\.jenkins\workspace\Playwright-TS-Automation"

param(
  [string]$Workspace = "C:\ProgramData\Jenkins\.jenkins\workspace\Playwright-TS-Automation"
)

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root ".env"
$dest = Join-Path $Workspace ".env"

if (-not (Test-Path $source)) {
  Write-Error "Missing $source — create .env with SMTP_* and EMAIL_* first."
  exit 1
}

if (-not (Test-Path $Workspace)) {
  Write-Error "Jenkins workspace not found: $Workspace"
  Write-Host "Run this script on the Jenkins build machine (after at least one job checkout), or pass -Workspace."
  exit 1
}

$keys = @('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_TO', 'EMAIL_CC', 'EMAIL_SUBJECT_PREFIX', 'EMAIL_BODY_HEADER', 'EMAIL_BODY_FOOTER')
$lines = Get-Content $source -Encoding UTF8
$out = @(
  '# Jenkins email — copied from repo .env (do not commit). CI runs headless.',
  'HEADLESS=true',
  'CI=true'
)
foreach ($line in $lines) {
  $t = $line.Trim()
  if ($t -match '^\s*#' -or [string]::IsNullOrWhiteSpace($t)) { continue }
  $name = ($t -split '=', 2)[0].Trim()
  if ($keys -contains $name) { $out += $line }
}

$required = @('SMTP_USER', 'SMTP_PASS', 'EMAIL_TO')
foreach ($r in $required) {
  if (-not ($out -match "^$r=")) {
    Write-Error "Missing $r in $source"
    exit 1
  }
}

Set-Content -Path $dest -Value $out -Encoding UTF8
Write-Host "Wrote $dest ($($out.Count) lines)."
Write-Host "Test on agent: cd `"$Workspace`" && npm run email:test"
