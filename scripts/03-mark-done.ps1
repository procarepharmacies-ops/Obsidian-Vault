# ============================================================
# ✅ Mark Task Done
# Usage: .\03-mark-done.ps1 "Install plugins"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskText,
    
    [ValidateSet("Ahmed","Gemini","Both")]
    [string]$Owner = "Both"
)

$VaultPath = "C:\Users\Ahmed\Documents\Obsidian Vault"
$files = @()

if ($Owner -eq "Ahmed" -or $Owner -eq "Both") {
    $files += "$VaultPath\AI-Brain\📋 Ahmed's Tasks.md"
}
if ($Owner -eq "Gemini" -or $Owner -eq "Both") {
    $files += "$VaultPath\AI-Brain\🤖 Gemini's Tasks.md"
}

$today = Get-Date -Format "yyyy-MM-dd"
$found = $false

foreach ($file in $files) {
    if (-not (Test-Path $file)) { continue }
    
    $content = Get-Content $file -Raw
    
    # Try to match the task text (partial match)
    if ($content -match [regex]::Escape("- [ ]") + ".*" + [regex]::Escape($TaskText)) {
        $pattern = "- \[ \] (.*$([regex]::Escape($TaskText)).*)"
        $replacement = "- [x] `$1 ✅ $today"
        $newContent = $content -replace $pattern, $replacement
        Set-Content $file $newContent
        Write-Host "✅ Marked done in: $(Split-Path $file -Leaf)" -ForegroundColor Green
        $found = $true
    }
}

if (-not $found) {
    Write-Host "⚠️  Task not found: '$TaskText'" -ForegroundColor Yellow
    Write-Host "   Check spelling or run 02-check-status.ps1 to see exact task names" -ForegroundColor DarkGray
} else {
    # Log to progress.md
    $progressFile = "$VaultPath\AI-Brain\progress.md"
    $logEntry = "`n- ✅ Task marked done: `"$TaskText`" on $today"
    Add-Content $progressFile $logEntry
    Write-Host "📝 Logged to progress.md" -ForegroundColor DarkGray
}
