# Set window title safely
try {
    $host.UI.RawUI.WindowTitle = "Pharmacy OS - Backend Server"
} catch {}

Clear-Host
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🚀 STARTING PHARMACY OS FASTAPI MIDDLEWARE BACKEND" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Go to backend folder relative to this script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\backend"

# Verify virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "⚡ Activating virtual environment..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
} else {
    Write-Host "❌ ERROR: Virtual environment 'venv' not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    Exit
}

# Run backend server
Write-Host "🟢 Launching FastAPI server on http://127.0.0.1:8000 ..." -ForegroundColor Green
python -m uvicorn app.main:app --reload
