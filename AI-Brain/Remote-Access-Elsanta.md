# Elsanta Remote Access — Credentials & Setup

**Last updated:** 2026-09-10

## Machine
- IP: `196.202.93.37`
- Location: Elsanta (different site, internet)
- Local account: `Ahmed`
- Microsoft account: `ahmedibrahimmahmoud@windowslive.com`

## Credentials
| Access | Username | Password |
|--------|----------|----------|
| RDP (port 3389) | ahmedibrahimmahmoud@windowslive.com | Procare ProcareAi@2026 |
| SSH (port 22) | ahmedibrahimmahmoud@windowslive.com | Procare ProcareAi@2026 |
| SQL Server | ahmedibrahim | Egstart01$ |
| UltraViewer | — | Egstart01$ |
| Windows/Microsoft account | ahmedibrahimmahmoud@windowslive.com | Procare ProcareAi@2026 |

> Password `Procare ProcareAi@2026` is the **Microsoft account password** — works for both RDP and SSH once SSH is installed on Elsanta.

## What worked / what didn't
- **Initial SSH attempts failed** — OpenSSH was not installed on Elsanta (no sshd.exe, no sshd_config, nothing listening on port 22 locally). Port 22 showed an SSH banner from outside but there was no local listener.
- **New password** (`Procare ProcareAi@2026`) set on the Microsoft account. SSH service needs to be installed and started on Elsanta for it to work.
- **RDP** — port 3389 is open on Elsanta and RDP is reachable. Registry key `fDenyTSConnections` must be 0 and firewall rule enabled.

## Setup scripts (run INSIDE Elsanta via Google Remote Desktop)

### Enable SSH + RDP (one-shot)
File: `enable_remote_elsanta.ps1` — installs OpenSSH, starts sshd, fixes password auth, enables RDP firewall + registry.

### Diagnose SSH status
File: `diagnose_ssh_elsanta.ps1` — checks processes, port listeners, sshd_config, local accounts.

## How to connect
1. **RDP:** `mstsc` → `196.202.93.37` → username: `ahmedibrahimmahmoud@windowslive.com` → password: `Procare ProcareAi@2026`
2. **SSH:** `ssh ahmedibrahimmahmoud@windowslive.com@196.202.93.37` → password: `Procare ProcareAi@2026`
3. **UltraViewer:** connect to Elsanta with password `Egstart01$` (Windows account password — may differ from Microsoft password)

## Quick reference
```
ssh ahmedibrahimmahmoud@windowslive.com@196.202.93.37
# password: Procare ProcareAi@2026
```

## Files in this folder
- `Remote-Access-Elsanta.md` — this document (credentials reference)
- `enable_remote_elsanta.ps1` — setup script (run on Elsanta)
- `diagnose_ssh_elsanta.ps1` — diagnostic script (run on Elsanta)
