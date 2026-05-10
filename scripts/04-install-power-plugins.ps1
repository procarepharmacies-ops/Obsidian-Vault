# ============================================================
# 🚀 Obsidian Power Plugin Installer — Full Stack
# Installs 15 curated plugins for a Second Brain setup
# Run AFTER 01-install-plugins.ps1 (core plugins)
# ============================================================

$VaultPath = "C:\Users\Ahmed\Documents\Obsidian Vault"
$PluginsPath = "$VaultPath\.obsidian\plugins"
$CommunityPluginsFile = "$VaultPath\.obsidian\community-plugins.json"

New-Item -ItemType Directory -Force -Path $PluginsPath | Out-Null

Write-Host ""
Write-Host "🚀 Obsidian Power Plugin Installer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Installing 15 curated plugins for your Second Brain..." -ForegroundColor DarkGray
Write-Host ""

# ─────────────────────────────────────────────
# Plugin Definitions (id, GitHub repo, name, tier)
# ─────────────────────────────────────────────
$plugins = @(

    # ── TIER 1: Task & Project Management ──────────────────
    @{ id = "obsidian-tasks-plugin";     repo = "obsidian-tasks-group/obsidian-tasks";       name = "Tasks";              tier = "🔴 Task Management"  },
    @{ id = "obsidian-kanban";           repo = "mgmeyers/obsidian-kanban";                  name = "Kanban";             tier = "🔴 Task Management"  },

    # ── TIER 1: Time & Daily Notes ──────────────────────────
    @{ id = "calendar";                  repo = "liamcain/obsidian-calendar-plugin";         name = "Calendar";           tier = "🟠 Time Management"  },
    @{ id = "periodic-notes";            repo = "liamcain/obsidian-periodic-notes";          name = "Periodic Notes";     tier = "🟠 Time Management"  },
    @{ id = "nldates-obsidian";          repo = "argenos/nldates-obsidian";                  name = "Natural Language Dates"; tier = "🟠 Time Management" },

    # ── TIER 1: Search & Navigation ────────────────────────
    @{ id = "omnisearch";                repo = "scambier/obsidian-omnisearch";              name = "Omnisearch";         tier = "🟡 Search & Nav"     },
    @{ id = "recent-files-obsidian";     repo = "tgrosinger/recent-files-obsidian";         name = "Recent Files";       tier = "🟡 Search & Nav"     },

    # ── TIER 2: Visual & Diagrams ───────────────────────────
    @{ id = "obsidian-excalidraw-plugin";repo = "zsviczian/obsidian-excalidraw-plugin";     name = "Excalidraw";         tier = "🟢 Visual Tools"     },
    @{ id = "obsidian-mind-map";         repo = "lynchjames/obsidian-mind-map";             name = "Mind Map";           tier = "🟢 Visual Tools"     },

    # ── TIER 2: Writing & Editing ───────────────────────────
    @{ id = "advanced-tables-obsidian";  repo = "tgrosinger/advanced-tables-obsidian";      name = "Advanced Tables";    tier = "🔵 Writing"          },
    @{ id = "obsidian-outliner";         repo = "vslinko/obsidian-outliner";                name = "Outliner";           tier = "🔵 Writing"          },
    @{ id = "obsidian-url-into-selection"; repo = "denolehov/obsidian-url-into-selection";  name = "Paste URL";          tier = "🔵 Writing"          },

    # ── TIER 2: Backup & Sync ────────────────────────────────
    @{ id = "obsidian-git";              repo = "denolehov/obsidian-git";                   name = "Obsidian Git";       tier = "⚙️ Backup"          },

    # ── TIER 3: Appearance ───────────────────────────────────
    @{ id = "obsidian-style-settings";   repo = "mgmeyers/obsidian-style-settings";         name = "Style Settings";     tier = "🎨 Appearance"       },
    @{ id = "obsidian-banners";          repo = "noatpad/obsidian-banners";                 name = "Banners";            tier = "🎨 Appearance"       }
)

# ─────────────────────────────────────────────
# Install Function
# ─────────────────────────────────────────────
function Install-Plugin {
    param($plugin)

    $pluginDir = "$PluginsPath\$($plugin.id)"
    New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null

    try {
        $release = Invoke-RestMethod "https://api.github.com/repos/$($plugin.repo)/releases/latest" -ErrorAction Stop
        $tag = $release.tag_name
        $baseUrl = "https://github.com/$($plugin.repo)/releases/download/$tag"

        Invoke-WebRequest "$baseUrl/main.js" -OutFile "$pluginDir\main.js" -UseBasicParsing -ErrorAction Stop
        Invoke-WebRequest "$baseUrl/manifest.json" -OutFile "$pluginDir\manifest.json" -UseBasicParsing -ErrorAction Stop
        try { Invoke-WebRequest "$baseUrl/styles.css" -OutFile "$pluginDir\styles.css" -UseBasicParsing -ErrorAction SilentlyContinue } catch {}

        Write-Host "   ✅ $($plugin.name) ($tag)" -ForegroundColor Green
        return $plugin.id

    } catch {
        # Fallback: try to get manifest.json directly from repo default branch
        try {
            Invoke-WebRequest "https://raw.githubusercontent.com/$($plugin.repo)/master/manifest.json" -OutFile "$pluginDir\manifest.json" -UseBasicParsing -ErrorAction Stop
            Invoke-WebRequest "https://raw.githubusercontent.com/$($plugin.repo)/master/main.js" -OutFile "$pluginDir\main.js" -UseBasicParsing -ErrorAction Stop
            Write-Host "   ✅ $($plugin.name) (from main branch)" -ForegroundColor Green
            return $plugin.id
        } catch {
            Write-Host "   ⚠️  $($plugin.name) — skipped (manual install may be needed)" -ForegroundColor Yellow
            return $null
        }
    }
}

# ─────────────────────────────────────────────
# Run Installations by Tier
# ─────────────────────────────────────────────
$installedIds = @()
$currentTier = ""

foreach ($plugin in $plugins) {
    if ($plugin.tier -ne $currentTier) {
        Write-Host ""
        Write-Host "  $($plugin.tier)" -ForegroundColor Magenta
        $currentTier = $plugin.tier
    }
    $result = Install-Plugin $plugin
    if ($result) { $installedIds += $result }
}

# ─────────────────────────────────────────────
# Update community-plugins.json
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "⚙️  Updating Obsidian plugin registry..." -ForegroundColor Yellow

if (Test-Path $CommunityPluginsFile) {
    $existing = Get-Content $CommunityPluginsFile | ConvertFrom-Json
    if ($null -eq $existing) { $existing = @() }
} else {
    $existing = @()
}

$merged = ($existing + $installedIds) | Select-Object -Unique | Where-Object { $_ -ne $null }
$merged | ConvertTo-Json | Set-Content $CommunityPluginsFile

Write-Host "   ✅ Registry updated ($($merged.Count) total plugins)" -ForegroundColor Green

# ─────────────────────────────────────────────
# Final Summary
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Power Plugins Installation Complete!" -ForegroundColor Green
Write-Host "   Installed: $($installedIds.Count) new plugins" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Restart Obsidian completely (close & reopen)" -ForegroundColor White
Write-Host "   2. Settings → Community Plugins → Toggle ON each new plugin" -ForegroundColor White
Write-Host "   3. Open: AI-Brain → 🔌 Plugin Guide.md for setup tips" -ForegroundColor White
Write-Host ""
