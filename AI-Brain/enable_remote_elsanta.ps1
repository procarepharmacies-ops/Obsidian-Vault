# Setup: Enable SSH + RDP on Elsanta
# Run inside Google Remote Desktop session on Elsanta (PowerShell as Admin)

Write-Host "=== Installing OpenSSH Server ===" -ForegroundColor Cyan
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service sshd -StartupType Automatic

Write-Host "`n=== Fixing sshd_config ===" -ForegroundColor Cyan
$cfg = "C:\ProgramData\ssh\sshd_config"
if (Test-Path $cfg) {
    $c = Get-Content $cfg
    if ($c -match "PasswordAuthentication\s+no") {
        ($c -replace "PasswordAuthentication\s+no", "PasswordAuthentication yes") | Set-Content $cfg
        Write-Host "PasswordAuthentication set to yes" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Enabling RDP ===" -ForegroundColor Cyan
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 0
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"

Write-Host "`n=== Restarting sshd ===" -ForegroundColor Cyan
Restart-Service sshd -Force
Start-Service sshd

Write-Host "`n=== Verification ===" -ForegroundColor Cyan
$ports = Get-NetTCPConnection -LocalPort 22,3389 -State Listen -ErrorAction SilentlyContinue
if ($ports) {
    $ports | Select-Object LocalPort, OwningProcess | Format-Table -AutoSize
    Write-Host "Both ports listening." -ForegroundColor Green
} else {
    Write-Host "Check ports manually." -ForegroundColor Yellow
}
