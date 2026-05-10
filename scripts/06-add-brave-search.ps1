# ============================================================
# 🔍 Add Brave Search to Antigravity
# Usage: .\06-add-brave-search.ps1 YOUR_API_KEY
# Get free key: https://brave.com/search/api/ (2000 req/month free)
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$SettingsPath = "C:\Users\Ahmed\.gemini\settings.json"

$settings = Get-Content $SettingsPath | ConvertFrom-Json
$mcpServers = @{}
$settings.mcpServers.PSObject.Properties | ForEach-Object { $mcpServers[$_.Name] = $_.Value }

$mcpServers["brave-search"] = @{
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-brave-search")
    env     = @{ BRAVE_API_KEY = $ApiKey }
}

$newSettings = @{ mcpServers = $mcpServers }
$newSettings | ConvertTo-Json -Depth 10 | Set-Content $SettingsPath

Write-Host ""
Write-Host "✅ Brave Search MCP added to Antigravity!" -ForegroundColor Green
Write-Host "   Restart Antigravity to activate." -ForegroundColor DarkGray
Write-Host ""
