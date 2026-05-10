# ============================================================
# 🔌 Obsidian Plugin Auto-Installer
# Run this in PowerShell to install all required plugins
# ============================================================

$VaultPath = "C:\Users\Ahmed\Documents\Obsidian Vault"
$PluginsPath = "$VaultPath\.obsidian\plugins"
$CommunityPluginsFile = "$VaultPath\.obsidian\community-plugins.json"

# Create plugins directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $PluginsPath | Out-Null

Write-Host ""
Write-Host "🔌 Obsidian Plugin Installer" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# --- Plugin definitions ---
$plugins = @(
    @{ id = "dataview";      repo = "blacksmithgu/obsidian-dataview";  name = "Dataview"     },
    @{ id = "templater-obsidian"; repo = "SilentVoid13/Templater";    name = "Templater"    },
    @{ id = "quickadd";      repo = "chhoumann/quickadd";              name = "QuickAdd"     },
    @{ id = "tag-wrangler";  repo = "pjeby/tag-wrangler";              name = "Tag Wrangler" }
)

# --- Install each plugin ---
$installedIds = @()

foreach ($plugin in $plugins) {
    $pluginDir = "$PluginsPath\$($plugin.id)"
    New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null

    Write-Host "⬇️  Installing $($plugin.name)..." -ForegroundColor Yellow

    try {
        # Get latest release metadata
        $release = Invoke-RestMethod "https://api.github.com/repos/$($plugin.repo)/releases/latest"
        $tag = $release.tag_name
        $baseUrl = "https://github.com/$($plugin.repo)/releases/download/$tag"

        # Download main.js
        Invoke-WebRequest "$baseUrl/main.js" -OutFile "$pluginDir\main.js" -UseBasicParsing

        # Download manifest.json
        Invoke-WebRequest "$baseUrl/manifest.json" -OutFile "$pluginDir\manifest.json" -UseBasicParsing

        # Download styles.css (optional — not all plugins have it)
        try {
            Invoke-WebRequest "$baseUrl/styles.css" -OutFile "$pluginDir\styles.css" -UseBasicParsing -ErrorAction SilentlyContinue
        } catch {}

        $installedIds += $plugin.id
        Write-Host "   ✅ $($plugin.name) ($tag) installed!" -ForegroundColor Green

    } catch {
        Write-Host "   ❌ Failed to install $($plugin.name): $_" -ForegroundColor Red
    }
}

# --- Enable plugins in community-plugins.json ---
Write-Host ""
Write-Host "⚙️  Enabling plugins in Obsidian config..." -ForegroundColor Yellow

if (Test-Path $CommunityPluginsFile) {
    $existing = Get-Content $CommunityPluginsFile | ConvertFrom-Json
} else {
    $existing = @()
}

$merged = ($existing + $installedIds) | Select-Object -Unique
$merged | ConvertTo-Json | Set-Content $CommunityPluginsFile

Write-Host "   ✅ community-plugins.json updated!" -ForegroundColor Green

# --- Summary ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DONE! Plugins installed:" -ForegroundColor Green
foreach ($id in $installedIds) { Write-Host "   • $id" -ForegroundColor White }
Write-Host ""
Write-Host "⚠️  ACTION REQUIRED:" -ForegroundColor Yellow
Write-Host "   1. Open Obsidian (or restart it if open)" -ForegroundColor White
Write-Host "   2. Go to: Settings → Community Plugins" -ForegroundColor White
Write-Host "   3. Toggle ON each plugin in the list" -ForegroundColor White
Write-Host "   4. Come back here and tell Gemini: 'Plugins enabled'" -ForegroundColor White
Write-Host ""
