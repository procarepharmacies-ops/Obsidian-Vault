# Set window title safely
try {
    $host.UI.RawUI.WindowTitle = "Pharmacy OS - React Frontend"
} catch {}

Clear-Host
Write-Host "===================================================" -ForegroundColor Green
Write-Host "🚀 STARTING PHARMACY OS VITE REACT FRONTEND" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

# Go to frontend folder relative to this script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\frontend"

# Launch dev server
Write-Host "🟢 Launching Vite React Dev Server on http://localhost:5173 ..." -ForegroundColor Green
npm run dev
