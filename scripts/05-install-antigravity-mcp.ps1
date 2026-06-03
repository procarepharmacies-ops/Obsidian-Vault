# ============================================================
# 🚀 Antigravity MCP Power Plugin Installer
# Installs 5 MCP servers that extend what Gemini AI can do
# Run this ONCE — then restart Antigravity
# ============================================================

Write-Host ""
Write-Host "🚀 Antigravity MCP Power Plugin Installer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$SettingsPath = "C:\Users\Ahmed\.gemini\antigravity\mcp_config.json"
$VaultPath = "C:\Users\Ahmed\Documents\Obsidian Vault"

# ─── Read current settings ───────────────────────────────
$settings = Get-Content $SettingsPath | ConvertFrom-Json

# Convert to hashtable so we can add to it
$mcpServers = @{}

# Preserve existing servers (MCP_DOCKER, etc.)
$settings.mcpServers.PSObject.Properties | ForEach-Object {
    $mcpServers[$_.Name] = $_.Value
}

Write-Host "  Existing MCP servers preserved:" -ForegroundColor DarkGray
$mcpServers.Keys | ForEach-Object { Write-Host "   • $_" -ForegroundColor DarkGray }
Write-Host ""

# ─── Define new MCP power plugins ──────────────────────────

Write-Host "  🔌 Installing power plugins..." -ForegroundColor Yellow
Write-Host ""

# 1. Filesystem — lets Gemini read/write your vault directly
Write-Host "  ⬇️  [1/5] Filesystem Server..." -ForegroundColor White
$mcpServers["filesystem"] = @{
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-filesystem",
                $VaultPath,
                "C:\Users\Ahmed\Documents",
                "C:\Users\Ahmed\.gemini")
}
Write-Host "     ✅ filesystem — Gemini can read/write your vault & docs" -ForegroundColor Green

# 2. Memory — persistent knowledge graph across sessions
Write-Host "  ⬇️  [2/5] Memory Server..." -ForegroundColor White
$mcpServers["memory"] = @{
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-memory")
}
Write-Host "     ✅ memory — Gemini remembers facts across conversations" -ForegroundColor Green

# 3. Sequential Thinking — better step-by-step reasoning
Write-Host "  ⬇️  [3/5] Sequential Thinking Server..." -ForegroundColor White
$mcpServers["sequential-thinking"] = @{
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-sequential-thinking")
}
Write-Host "     ✅ sequential-thinking — Better multi-step problem solving" -ForegroundColor Green

# 4. Context7 — live documentation & library lookups
Write-Host "  ⬇️  [4/5] Context7 Server..." -ForegroundColor White
$mcpServers["context7"] = @{
    command = "npx"
    args    = @("-y", "@upstash/context7-mcp")
}
Write-Host "     ✅ context7 — Up-to-date docs for any library (no hallucinations)" -ForegroundColor Green

# 5. Puppeteer — browser automation (scraping, screenshots)
Write-Host "  ⬇️  [5/5] Puppeteer Browser Server..." -ForegroundColor White
$mcpServers["puppeteer"] = @{
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-puppeteer")
}
Write-Host "     ✅ puppeteer — Gemini can browse websites & take screenshots" -ForegroundColor Green

# ─── Brave Search (requires API key) ────────────────────────
Write-Host ""
Write-Host "  ⚠️  Brave Search — SKIPPED (needs API key)" -ForegroundColor Yellow
Write-Host "     Get free key at: https://brave.com/search/api/" -ForegroundColor DarkGray
Write-Host "     Then run: .\06-add-brave-search.ps1 YOUR_KEY" -ForegroundColor DarkGray

# ─── Write updated settings.json ────────────────────────────
Write-Host ""
Write-Host "  💾 Writing updated settings.json..." -ForegroundColor Yellow

$newSettings = @{ mcpServers = $mcpServers }
$newSettings | ConvertTo-Json -Depth 10 | Set-Content $SettingsPath

Write-Host "     ✅ settings.json updated!" -ForegroundColor Green

# ─── Pre-cache packages (speeds up first load) ───────────────
Write-Host ""
Write-Host "  🔄 Pre-downloading MCP packages (this may take 1-2 min)..." -ForegroundColor Yellow

$packages = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-sequential-thinking",
    "@upstash/context7-mcp",
    "@modelcontextprotocol/server-puppeteer"
)

foreach ($pkg in $packages) {
    Write-Host "     Caching $pkg..." -ForegroundColor DarkGray
    $null = npx -y $pkg --help 2>&1
    Write-Host "     ✅ Cached" -ForegroundColor Green
}

# ─── Summary ────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Antigravity Power Plugins Installed!" -ForegroundColor Green
Write-Host ""
Write-Host "  You now have 5 new MCP capabilities:" -ForegroundColor White
Write-Host "   🗂️  filesystem       — Vault read/write access" -ForegroundColor White
Write-Host "   🧠  memory           — Persistent memory across sessions" -ForegroundColor White  
Write-Host "   🔗  sequential-think — Step-by-step reasoning" -ForegroundColor White
Write-Host "   📚  context7         — Live library documentation" -ForegroundColor White
Write-Host "   🌐  puppeteer        — Web browsing & screenshots" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  REQUIRED: Restart Antigravity (close + reopen the app)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  After restart, tell Gemini:" -ForegroundColor DarkGray
Write-Host "  'What MCP tools do you have?' to verify" -ForegroundColor DarkGray
Write-Host ""
