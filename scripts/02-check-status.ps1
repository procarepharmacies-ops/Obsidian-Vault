# ============================================================
# 📊 Task Status Checker
# Run this to see your current to-do list in the terminal
# ============================================================

$VaultPath = "C:\Users\Ahmed\Documents\Obsidian Vault"
$AhmedTasks = "$VaultPath\AI-Brain\📋 Ahmed's Tasks.md"
$GeminiTasks = "$VaultPath\AI-Brain\🤖 Gemini's Tasks.md"
$ProgressLog = "$VaultPath\AI-Brain\progress.md"

Write-Host ""
Write-Host "📊 TASK STATUS REPORT" -ForegroundColor Cyan
Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor DarkGray
Write-Host "=============================" -ForegroundColor Cyan

# --- Parse checkboxes from a markdown file ---
function Get-Tasks {
    param($filePath, $label)
    
    if (-not (Test-Path $filePath)) {
        Write-Host "   ⚠️  File not found: $filePath" -ForegroundColor Red
        return
    }

    $content = Get-Content $filePath
    $pending = @()
    $done = @()

    foreach ($line in $content) {
        if ($line -match "^\s*- \[ \] (.+)") { $pending += $matches[1] }
        if ($line -match "^\s*- \[x\] (.+)") { $done += $matches[1] }
    }

    Write-Host ""
    Write-Host "👤 $label" -ForegroundColor Magenta
    Write-Host "   Pending: $($pending.Count)  |  Done: $($done.Count)" -ForegroundColor DarkGray
    
    if ($pending.Count -gt 0) {
        Write-Host "   🔴 To Do:" -ForegroundColor Yellow
        foreach ($t in $pending) { Write-Host "      • $t" -ForegroundColor White }
    } else {
        Write-Host "   ✅ All tasks complete!" -ForegroundColor Green
    }
}

Get-Tasks $AhmedTasks "Ahmed's Tasks"
Get-Tasks $GeminiTasks "Gemini's Tasks"

# --- Plugin check ---
Write-Host ""
Write-Host "🔌 Plugin Status" -ForegroundColor Magenta
$pluginsPath = "$VaultPath\.obsidian\plugins"
$required = @("dataview","templater-obsidian","quickadd","tag-wrangler")
foreach ($p in $required) {
    if (Test-Path "$pluginsPath\$p\main.js") {
        Write-Host "   ✅ $p" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $p — NOT INSTALLED (run 01-install-plugins.ps1)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "💡 Tip: Open Obsidian → AI-Brain → 📋 Team Command Center" -ForegroundColor DarkGray
Write-Host ""
