# 🐧 ProCare Pharmacy OS — Fedora Workstation Setup Guide

> **Target:** Fedora Workstation 39/40/41 (GNOME)
> **Goal:** Run the full React + FastAPI dashboard locally on Fedora and connect it to the live SQL Server databases.

---

## ✅ Step 1: Install System Dependencies

Open **Terminal** and run these commands one by one:

```bash
# 1. Update the system
sudo dnf update -y

# 2. Install Python 3 + pip + venv
sudo dnf install -y python3 python3-pip python3-virtualenv

# 3. Install Node.js 20 LTS + npm (via NodeSource)
sudo dnf install -y nodejs npm
# Verify:
node --version   # should be v20.x or higher
npm --version

# 4. Install Git (if not already installed)
sudo dnf install -y git

# 5. Install unixODBC development libraries (required for pyodbc)
sudo dnf install -y unixODBC unixODBC-devel gcc gcc-c++
```

---

## ✅ Step 2: Install Microsoft ODBC Driver 18 for SQL Server

This is the most critical step. The backend uses `pyodbc` to talk to SQL Server.

```bash
# Add the Microsoft repo for Fedora
sudo curl -o /etc/yum.repos.d/mssql-release.repo \
  https://packages.microsoft.com/config/rhel/9/prod.repo

# Install ODBC Driver 18
sudo ACCEPT_EULA=Y dnf install -y msodbcsql18

# Install optional SQL tools (sqlcmd for testing)
sudo ACCEPT_EULA=Y dnf install -y mssql-tools18

# Verify the driver is registered
odbcinst -q -d -n "ODBC Driver 18 for SQL Server"
```

> **Expected output:** `[ODBC Driver 18 for SQL Server]` — if you see this, the driver is ready.

---

## ✅ Step 3: Clone / Transfer the Project

### Option A — Copy from Windows (USB or Network)

Transfer the entire `Pharmacy_Project` folder to your Fedora machine.
Suggested location: `~/Projects/Pharmacy_Project`

```bash
# Example if copying via USB:
cp -r /run/media/$USER/USB_DRIVE/Pharmacy_Project ~/Projects/
cd ~/Projects/Pharmacy_Project
```

### Option B — Use Git (if you've pushed to a repo)

```bash
git clone https://github.com/YOUR_USERNAME/pharmacy-os.git ~/Projects/Pharmacy_Project
cd ~/Projects/Pharmacy_Project
```

---

## ✅ Step 4: Configure the `.env` File

```bash
cd ~/Projects/Pharmacy_Project
nano .env
```

Make sure it contains:

```env
SQL_USER=ahmedibrahim
SQL_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
SQL_DATABASE=PharmacyDB
SQL_SERVER=196.202.93.37,1433
```

Save with `Ctrl+O`, then `Ctrl+X`.

---

## ✅ Step 5: Set Up the Python Backend

```bash
# Navigate to backend
cd ~/Projects/Pharmacy_Project/backend

# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt

# Verify pyodbc can find the SQL Server driver
python3 -c "import pyodbc; print(pyodbc.drivers())"
# You should see: ['ODBC Driver 18 for SQL Server']
```

---

## ✅ Step 6: Set Up the React Frontend

```bash
cd ~/Projects/Pharmacy_Project/frontend

# Install Node.js packages
npm install
```

---

## ✅ Step 7: Run the Dashboard

You need **two terminals** open side by side.

### Terminal 1 — Backend (FastAPI)

```bash
cd ~/Projects/Pharmacy_Project/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Look for: `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2 — Frontend (Vite + React)

```bash
cd ~/Projects/Pharmacy_Project/frontend
npm run dev
```

✅ Look for: `Local: http://localhost:5173/`

---

## ✅ Step 8: Open the Dashboard

Open Firefox or Chrome and go to:

```
http://localhost:5173
```

You should see the **ProCare Pharmacy OS** dashboard fully loaded with live SQL data from both Santa and Masala branches.

---

## 🔧 Troubleshooting

### ❌ `pyodbc.Error: ('01000', "...")` — ODBC Driver not found

```bash
# Reinstall the driver and re-link it
sudo ACCEPT_EULA=Y dnf reinstall -y msodbcsql18
odbcinst -q -d
```

### ❌ `Connection refused` — SQL Server not reachable

```bash
# Test raw TCP connectivity to both branch servers
nc -zv 196.202.93.37 1433   # Santa
nc -zv 196.202.93.36 1433   # Masala
```

> If both fail, your Fedora machine is not on the same network/VPN as the pharmacy servers.

### ❌ `npm: command not found`

```bash
sudo dnf install -y nodejs npm
```

### ❌ Frontend shows "Connection lost" error

Make sure the backend is running first, then refresh the frontend page.

---

## 🚀 Optional: Create Desktop Launch Scripts

Create a single-click launcher on Fedora:

```bash
# Create launch script
cat > ~/Projects/Pharmacy_Project/launch.sh << 'EOF'
#!/bin/bash
# Launch Pharmacy OS Backend + Frontend
cd "$(dirname "$0")"

echo "🚀 Starting Pharmacy OS..."

# Start backend in background
source backend/venv/bin/activate
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Backend PID: $BACKEND_PID"
echo "✅ Frontend PID: $FRONTEND_PID"
echo ""
echo "📊 Dashboard: http://localhost:5173"
echo "📡 API Docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT
wait
EOF

chmod +x ~/Projects/Pharmacy_Project/launch.sh
```

Run with:

```bash
~/Projects/Pharmacy_Project/launch.sh
```

---

## 📡 API Documentation

Once the backend is running, visit:

```
http://localhost:8000/docs
```

This opens the **FastAPI Swagger UI** — you can test every endpoint directly in the browser.

| Endpoint | Description |
|---|---|
| `GET /api/v1/sales/stats` | Today's consolidated revenue + transaction count (Resilient Fallback Mode) |
| `GET /api/v1/sales/daily` | 7-day revenue breakdown by branch |
| `GET /api/v1/sales/recent` | Latest 10 invoices (live feed) |
| `GET /api/v1/inventory/` | Low-stock items (≤15 units) from both branches |
| `GET /api/v1/cashflow/` | 7-day cash inflow/outflow chart + summary |
| `GET /api/v1/schedule/` | Employee roster + shift status |
| `GET /api/v1/purchasing/` | AI procurement recommendations (80/20 rule) |
| `GET /api/v1/clinical/interactions` | Check drug-drug interactions (Aspirin, Warfarin, Concor, etc.) |
| `GET /api/v1/clinical/otc-recommendations` | Get OTC treatment recommendations based on patient symptoms |
| `GET /api/v1/loyalty/members` | Get customer directory and reward point balances |
| `POST /api/v1/loyalty/send-alert` | Send automated WhatsApp loyalty point alerts (Payload verification mode) |

---

## 🔒 Step 9: Cloudflare Zero Trust Remote Access (Secure Cloud Tunnel)

To access your local ProCare Dashboard from a remote device safely without port forwarding:

### 1. Install Cloudflared on Fedora Workstation
```bash
# Download and install the RPM package
sudo dnf install -y https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
```

### 2. Login to Cloudflare Zero Trust
```bash
cloudflared tunnel login
```
*Click the browser link and authorize access to your registered domain.*

### 3. Create a Secure Cloud Tunnel
```bash
cloudflared tunnel create procare-tunnel
```
*Note down the generated Tunnel ID UUID.*

### 4. Configure the Tunnel Route
Create a configuration file `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID_UUID>
credentials-file: /home/<USER>/.cloudflared/<TUNNEL_ID_UUID>.json

ingress:
  - hostname: dashboard.procarepharmacies.com
    service: http://localhost:5173
  - hostname: api.procarepharmacies.com
    service: http://localhost:8000
  - service: http_status:404
```

### 5. Setup Domain DNS Route
```bash
cloudflared tunnel route dns procare-tunnel dashboard.procarepharmacies.com
cloudflared tunnel route dns procare-tunnel api.procarepharmacies.com
```

### 6. Run the Tunnel as a Background Service
```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```
*Your dashboard and secure API gateways are now exposed globally through the Cloudflare edge network under robust Zero Trust protection!*

---
ProCare Pharmacies — B.L.A.S.T. Protocol
