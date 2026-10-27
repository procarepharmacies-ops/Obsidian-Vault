# Register-Sync-Task.ps1
# Automates 2-way sync via Windows Task Scheduler every 2 hours silently using pythonw.exe

$vaultPath = "C:\Users\Ahmed\Documents\Obsidian Vault"
$pythonwPath = "C:\Users\Ahmed\AppData\Local\Programs\Python\Python313\pythonw.exe"
$scriptPath = Join-Path $vaultPath "tools\git_sync.py"

$action = New-ScheduledTaskAction -Execute $pythonwPath -Argument "`"$scriptPath`"" -WorkingDirectory $vaultPath
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 2) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "ObsidianVaultGitSync" -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host "✅ ObsidianVaultGitSync registered successfully. Running every 2 hours." -ForegroundColor Green
