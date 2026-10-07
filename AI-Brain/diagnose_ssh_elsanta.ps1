# Diagnose SSH on Elsanta
# Run inside Google Remote Desktop session on Elsanta (PowerShell)

Write-Host "=== SSH processes ===" -ForegroundColor Cyan
Get-Process -Name sshd, ssh, ssh-agent -ErrorAction SilentlyContinue | Select-Object Name, Id, Path, Company

Write-Host "`n=== Port 22 listener ===" -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 22 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "Listening! PID: $($conn.OwningProcess)"
    Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue | Select-Object Name, Id, Path
} else {
    Write-Host "Nothing on port 22"
}

Write-Host "`n=== OpenSSH paths ===" -ForegroundColor Cyan
@(
    "C:\Program Files\OpenSSH\sshd.exe",
    "C:\Windows\System32\OpenSSH\sshd.exe"
) | ForEach-Object { Write-Host "  $_ : $(if(Test-Path $_){'EXISTS'}else{'missing'})" }

Write-Host "`n=== SSH services ===" -ForegroundColor Cyan
Get-Service -Name *ssh* -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType, PathName

Write-Host "`n=== sshd_config ===" -ForegroundColor Cyan
$cfg = "C:\ProgramData\ssh\sshd_config"
if (Test-Path $cfg) { Get-Content $cfg | Select-Object -First 25 }
else { Write-Host "No sshd_config" }
