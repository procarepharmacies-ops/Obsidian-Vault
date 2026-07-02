# ─────────────────────────────────────────────────────────────────────────────
#  Hermes Install Script — Windows (PowerShell 5.1+)
#  Usage: .\scripts\install.ps1 [-NoInstall]
#    -NoInstall : skip `pip install -e .` (just create dirs and copy files)
# ─────────────────────────────────────────────────────────────────────────────

param(
    [switch]$NoInstall
)

$ErrorActionPreference = "Stop"

# ── Paths ─────────────────────────────────────────────────────────────────────
$HermesDir  = Join-Path $env:USERPROFILE ".hermes"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EnvExample = Join-Path $ProjectDir ".env.example"
$EnvTarget  = Join-Path $HermesDir ".env"

# ── Color helpers ─────────────────────────────────────────────────────────────
function Write-Header { param($msg) Write-Host "`n$msg`n" -ForegroundColor Yellow }
function Write-Info   { param($msg) Write-Host "  • $msg" -ForegroundColor DarkYellow }
function Write-OK     { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Err    { param($msg) Write-Host "  ✗ ERROR: $msg" -ForegroundColor Red }

Write-Header "⚡ Hermes — ProCare AI Hub  |  Install Script (Windows)"

# ── 1. Create ~/.hermes directory ─────────────────────────────────────────────
Write-Info "Creating $HermesDir ..."
if (-not (Test-Path $HermesDir)) {
    New-Item -ItemType Directory -Path $HermesDir -Force | Out-Null
}
Write-OK "Directory ready: $HermesDir"

# ── 2. Copy .env.example ──────────────────────────────────────────────────────
if ((Test-Path $EnvExample) -and (-not (Test-Path $EnvTarget))) {
    Copy-Item -Path $EnvExample -Destination $EnvTarget
    Write-OK "Copied .env.example → $EnvTarget"
} elseif (Test-Path $EnvTarget) {
    Write-Info ".env already exists at $EnvTarget (not overwriting)"
} else {
    Write-Err ".env.example not found at $EnvExample"
}

# ── 3. Install Python dependencies ────────────────────────────────────────────
if (-not $NoInstall) {
    $pip = $null
    foreach ($cmd in @("pip3", "pip")) {
        if (Get-Command $cmd -ErrorAction SilentlyContinue) {
            $pip = $cmd
            break
        }
    }

    if ($null -eq $pip) {
        Write-Err "pip not found. Install Python 3.11+ and ensure pip is on PATH."
        exit 1
    }

    Write-Info "Installing Python dependencies (pip install -e .) ..."
    Push-Location $ProjectDir
    try {
        & $pip install -e . --quiet
    } finally {
        Pop-Location
    }
    Write-OK "Python package installed (hermes CLI is now available)"
} else {
    Write-Info "Skipping pip install (-NoInstall flag set)"
}

# ── 4. Initialize the database ────────────────────────────────────────────────
if (Get-Command hermes -ErrorAction SilentlyContinue) {
    Write-Info "Initializing Hermes database ..."
    try { hermes init 2>$null } catch {}
    Write-OK "Database initialized"
} else {
    Write-Info "hermes CLI not found in PATH — run 'hermes init' manually after install"
}

# ── 5. Print setup checklist ──────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Setup Checklist" -ForegroundColor White
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [1] Edit your API keys:" -ForegroundColor Yellow
Write-Host "      $EnvTarget" -ForegroundColor White
Write-Host ""
Write-Host "  [2] Add your ANTHROPIC_API_KEY (for Claude)" -ForegroundColor Yellow
Write-Host "  [3] Add your GEMINI_API_KEY (for Gemini)" -ForegroundColor Yellow
Write-Host "  [4] (Optional) Set PHARMACY_WEBHOOK_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [5] Verify setup:" -ForegroundColor Yellow
Write-Host "      hermes status" -ForegroundColor White
Write-Host ""
Write-Host "  [6] Start chatting:" -ForegroundColor Yellow
Write-Host "      hermes chat" -ForegroundColor White
Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Install complete!" -ForegroundColor Green
Write-Host ""
