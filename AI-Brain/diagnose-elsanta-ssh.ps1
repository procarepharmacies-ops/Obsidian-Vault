# Run this in PowerShell on ELSANTA (inside your Google Remote Desktop session)
# It diagnoses the SSH setup and restarts it so the new password takes effect.

Write-Host "=== Running SSH-related processes ===" -ForegroundColor Cyan
Get-Process -Name sshd, ssh, ssh-agent -ErrorAction SilentlyContinue | Select-Object Name, Id, Path, Company

Write-Host "`n=== Known OpenSSH paths ===" -ForegroundColor Cyan
$paths = @(
    "C:\Program Files\OpenSSH\sshd.exe",
    "C:\Program Files (x86)\OpenSSH\sshd.exe",
    "C:\Windows\System32\OpenSSH\sshd.exe"
)
foreach ($p in $paths) {
    $found = Test-Path $p
    Write-Host "  $p -> $(if($found){'EXISTS'}else{'not found'})"
}

Write-Host "`n=== SSH services ===" -ForegroundColor Cyan
Get-Service -Name *ssh* -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType, PathName

Write-Host "`n=== Who owns port 22 ===" -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 22 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "  Listening! Owning PID: $($conn.OwningProcess)"
    Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue | Select-Object Name, Id, Path, Company
} else {
    Write-Host "  Nothing listening on port 22"
}

Write-Host "`n=== SSH host keys ===" -ForegroundColor Cyan
$sshdir = "C:\ProgramData\ssh"
if (Test-Path $sshdir) {
    Get-ChildItem $sshdir -ErrorAction SilentlyContinue | Select-Object Name, Length
} else {
    Write-Host "  $sshdir does not exist"
}

Write-Host "`n=== sshd_config ===" -ForegroundColor Cyan
$config = "C:\ProgramData\ssh\sshd_config"
if (Test-Path $config) {
    Get-Content $config | Select-Object -First 30
} else {
    Write-Host "  $config not found"
}
