# ============================================================
# 🔍 Add DuckDuckGo Search to Antigravity (TRULY FREE)
# Usage: .\07-add-duckduckgo-search.ps1
# No API Key Required!
# ============================================================

$SettingsPath = "C:\Users\Ahmed\.gemini\settings.json"

if (-not (Test-Path $SettingsPath)) {
    Write-Host "⚠️ Antigravity settings not found at $SettingsPath" -ForegroundColor Yellow
    exit
}

$settings = Get-Content $SettingsPath -Raw | ConvertFrom-Json
$mcpServers = $settings.mcpServers


# Add DuckDuckGo Server
$duckduckgoConfig = @{
    command = "npx"
    args    = @("-y", "@ericthered926/duckduckgo-mcp-server")
}

if (-not $settings.mcpServers.duckduckgo) {
    $settings.mcpServers | Add-Member -MemberType NoteProperty -Name "duckduckgo" -Value $duckduckgoConfig
} else {
    $settings.mcpServers.duckduckgo = $duckduckgoConfig
}

$settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsPath

Write-Host ""
Write-Host "✅ DuckDuckGo Search MCP added to Antigravity!" -ForegroundColor Green
Write-Host "   No API key needed. Restart Antigravity to activate." -ForegroundColor DarkGray
Write-Host ""
