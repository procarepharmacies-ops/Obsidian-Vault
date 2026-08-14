---
title: Hermes Fleet Worker Setup — On-Site Instructions
tags: [hermes, fleet, ssh, setup, ops]
type: sop
author: Antigravity
status: ready-for-execution
---

# 🖥️ Hermes Fleet Worker Setup — On-Site Instructions

> **Purpose:** Set up Hermes worker nodes at each pharmacy location.
> **Locations:** 4 total — 2 on LAN-A (Elsanta), 2 on LAN-B (Mas-hala)

---

## Network Map

| Location | Role | IP | Hostname |
|---|---|---|---|
| Location 1 | **Hub + Gateway** (Elsanta server) | `196.202.93.37` | elsanta-server |
| Location 2 | **Worker** (Elsanta workstation) | `196.202.93.38` | elsanta-ws |
| Location 3 | **Hub + Gateway** (Mas-hala server) | `192.168.1.2` | mashala-server |
| Location 4 | **Worker** (Mas-hala workstation) | `192.168.1.3` | mashala-ws |

---

## Pre-Requisites (Hub — Location 1, already done)

1. ✅ Hermes installed on hub
2. ✅ SSH hub key generated: `/c/Users/Ahmed/.ssh/hermes_hub`
3. ✅ `run_on.sh` script ready at `/c/Users/Ahmed/bin/run_on.sh`
4. ✅ Hermes dashboard running on port `9119` with basic auth
5. ✅ `setup-worker-scripts.md` at `/c/Users/Ahmed/bin/`

**Hub public key (for on-site technicians):**
```
ssh-ed25519 AAAAC3NzaC1...Ahmed@procare-hub
```
(Get from: `cat /c/Users/Ahmed/.ssh/hermes_hub.pub`)

---

## Worker Setup — On-Site Technician Instructions

Each worker machine (Locations 2 & 4) needs the following done by someone on-site.

### Windows Native (recommended for pharmacy workstations)

1. **Install Hermes** (if not already installed):
   ```powershell
   winget install --id=NousResearch.Hermes --accept-package
   ```

2. **Install OpenSSH Server**:
   ```powershell
   Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
   Start-Service sshd
   Set-Service sshd -StartupType Automatic
   ```

3. **Create `hermes` user**:
   ```powershell
   net user hermes HermesWorker2026! /add /fullname:"Hermes Worker"
   net localgroup "Remote Desktop Users" hermes /add
   ```

4. **Install hub's public key**:
   ```powershell
   mkdir C:\Users\hermes\.ssh 2>$null
   # Paste the hub's public key into this file:
   # C:\Users\hermes\.ssh\authorized_keys
   # (Get the key from the hub operator)
   ```

5. **Disable password auth (optional, for security)**:
   ```powershell
   (Get-Content 'C:\ProgramData\ssh\sshd_config') \
     -replace '#PasswordAuthentication yes','PasswordAuthentication no' |
     Set-Content 'C:\ProgramData\ssh\sshd_config'
   Restart-Service sshd
   ```

6. **Install toolchains** (if needed for code execution):
   ```powershell
   winget install Python.Python.3 --accept-package
   winget install Git.Git --accept-package
   ```

7. **Create work directory**:
   ```powershell
   mkdir C:\opt\hermes-work
   chown hermes:hermes C:\opt\hermes-work
   ```

### Linux/macOS Workers

1. **Install Hermes**:
   ```bash
   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
   ```

2. **Install OpenSSH Server**:
   ```bash
   # Debian/Ubuntu
   sudo apt-get update && sudo apt-get install -y openssh-server
   sudo systemctl enable --now ssh

   # RHEL/Fedora
   sudo dnf install -y openssh-server
   sudo systemctl enable --now sshd
   ```

3. **Create `hermes` user**:
   ```bash
   sudo useradd -m -s /bin/bash hermes
   ```

4. **Install hub's public key**:
   ```bash
   sudo -u hermes mkdir -p /home/hermes/.ssh
   sudo -u hermes chmod 700 /home/hermes/.ssh
   # Paste hub public key into:
   # /home/hermes/.ssh/authorized_keys
   sudo -u hermes chmod 600 /home/hermes/.ssh/authorized_keys
   ```

5. **Disable password auth**:
   ```bash
   sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```

7. **Create work directory**:
   ```bash
   sudo mkdir -p /opt/hermes-work
   sudo chown hermes:hermes /opt/hermes-work
   ```

---

## Post-Setup Verification (Hub Operator)

Once all workers are set up on-site, verify from the Hub (Location 1):

```bash
# Test each worker
/run_on.sh loc2 "echo 'Location 2 OK' && hermes --version"
/run_on.sh loc3 "echo 'Location 3 OK' && hermes --version"
/run_on.sh loc4 "echo 'Location 4 OK' && hermes --version"
```

If all return successfully, mark Phase 7 as complete and proceed to Phase 8 (obsidian-git sync).

---

## Location 3 — Gateway Hub (Mas-hala Server)

Location 3 (Mas-hala server at `192.168.1.2`) is special — it runs **both** as a
gateway hub (like Location 1) and accepts SSH from Location 1.

On Location 3, in addition to worker setup above:

1. **Start Hermes Dashboard** on port 9119:
   ```bash
   hermes dashboard --port 9119 --host 0.0.0.0 --skip-build --no-open
   ```
   (Configure basic_auth in config.yaml with:
   `hermes config set dashboard.basic_auth.username admin`)

2. **Set up SSH access from Location 1 hub**:
   - Add Location 3's `hermes` user public key to Location 1's `~/.ssh/authorized_keys`
   - Test: `ssh -i ~/.ssh/hermes_hub hermes@192.168.1.2 "echo test"`

3. **Cross-LAN sync** (Location 1 → Location 3):
   ```bash
   hermes cron create --name "sync-to-lan-b" \
     --schedule "*/5 * * * *" \
     --prompt "Sync kanban task status from LAN-A hub (196.202.93.37:9119) to LAN-B hub (192.168.1.2:9119)"
   ```

4. **Shared resources**:
   - Mount or sync the Obsidian vault at `C:\Users\Ahmed\Documents\Obsidian Vault`
   - Install obsidian-git plugin with auto-commit every 10 min
   - ProCare OS backend pointing to this location's SQL Server

---

## What Each Location Runs

| Location | Hermes Dashboard | Gateway | SSH Server | ProCare OS |
|---|---|---|---|---|
| Loc 1 (Elsanta Server) | ✅ Port 9119, auth | ✅ Dashboard | ✅ Yes (from loc2) | ✅ Primary (196.202.93.37) |
| Loc 2 (Elsanta WS) | ❌ | ❌ | ✅ Worker (from loc1 hub) | ❌ Worker only |
| Loc 3 (Mas-hala Server) | ✅ Port 9119, auth | ✅ Cross-LAN gateway | ✅ Worker (from loc1 hub) + gateway | ✅ Replica (192.168.1.2) |
| Loc 4 (Mas-hala WS) | ❌ | ❌ | ✅ Worker (from loc3) | ❌ Worker only |

---

## Delegation From Hub

Once workers are reachable, the Hub can delegate tasks:

```bash
# Run on Location 2 (Elsanta workstation)
run_on.sh loc2 "cd /opt/hermes-work && hermes ... "

# Run on Location 4 (Mas-hala workstation)
run_on.sh loc4 "cd /opt/hermes-work && hermes ... "
```

Or via Hermes' `delegate_task` with SSH in context.
