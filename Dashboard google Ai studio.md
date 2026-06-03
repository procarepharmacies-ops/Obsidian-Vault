- 📋 Project: Pharmacy OS Modernization (Santa & Masala)
**Status:** Phase 0 (Infrastructure)
**Environment:** Windows 11 (Dev) | SQL Server Dashboard (Data Source)
**Stack:** Python, SQL Server, Streamlit (UI), OpenAI/Local LLM (AI)

## 🎯 Phase 0: Infrastructure & Security (Current)

- [x] Establish Visual Connection (AnyDesk).
- [x] Establish Data Connection (Port 1433 + SQL Driver on Fedora). ✅ 2026-05-12
 	- [x] Create `ahmedibrahim` SQL User. ✅ 2026-05-16
- [x] Set up GitHub Repository (Private). ✅ 2026-05-12
- [x] Initialize Obsidian Project Folder. ✅ 2026-05-12

## 🔍 Phase 1: Data Discovery (Reverse Engineering E-Stock)

- [ ] Map the SQL Schema (Identify tables for: `Sales`, `Inventory`, `Customers`, `Drugs`).
- [ ] Create a "Data Dictionary" in Obsidian.
- [ ] Run initial "Sanity Check" queries (Do SQL totals match E-Stock reports?).

## 📊 Phase 2: The Core Dashboard (MVP)

- [ ] **Sales Module:** Daily/Weekly/Monthly revenue for Santa vs. Masala.
- [ ] **Inventory Module:** Low stock alerts and "Dead Stock" (non-moving) detection.
- [ ] **Transfer Module:** Tool to identify what to move from Santa to Masala.

## 🤖 Phase 3: AI & Clinical Layer

- [ ] **Counseling Assistant:** AI-generated patient advice based on drug names.
- [ ] **Drug-Interaction Checker:** Logic to flag risky combinations from the script list.
- [ ] **Alternative Finder:** Suggest generics or stock-available alternatives.

## 💳 Phase 4: Loyalty & Operations

- [ ] **Loyalty Engine:** Side-database to track points based on SQL sales history.
- [ ] **Staff Tasker:** Dashboard for assistants (Expiring meds, cleaning tasks).

---

### 🗄️ Step 1: GitHub Setup

Since you are on Fedora, let's get your repository ready.

1. Go to GitHub and create a **Private** repository named `pharmacy-dashboard`.
2. On your Fedora terminal:

```bash
mkdir ~/Documents/pharmacy_project
cd ~/Documents/pharmacy_project
git init
echo "# Pharmacy Dashboard Project" >> README.md
git add README.md
git commit -m "Initial commit"
# Link it to your GitHub URL
git remote add origin https://github.com/YOUR_USERNAME/pharmacy-dashboard.git
git push -u origin main
```

### 🧠 Step 2: Obsidian Structure

In your Obsidian Vault, I recommend this folder structure for this project:

- `Pharmacy_Project/`
  - `Meetings_Log/` (Save our chat summaries here)
  - `Technical_Docs/` (SQL Schema, Python Logic)
  - `Clinical_AI/` (Prompts for drug interactions)
  - `Daily_Tasks/` (What you are working on today)

---

### 🚀 Immediate Progress Report: Today's Goal

To finish **Phase 0**, we need to verify the "Data Bridge."

**Your To-Do List:**

1. **In AnyDesk (Windows):** Create the `PharmacyDash` user in SSMS.
2. **In Fedora:** Install the SQL Drivers (I gave you the commands in the previous message).
3. **In Fedora:** Create a file in your new project folder called `test_connection.py`.

**Copy this code into `test_connection.py` (Save it in your Project Folder):**

```python
import pyodbc

# Update these details
server = '196.202.93.37,1433'
database = 'YOUR_DB_NAME' # Update when specific DB is known
username = 'ahmedibrahim'
password = 'Egstart01$'

connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes;'

try:
    conn = pyodbc.connect(connection_string)
    print("✅ Success! Fedora is talking to the Pharmacy Database.")
    conn.close()
except Exception as e:
    print(f"❌ Connection Failed: {e}")
```

**How would you like to update the progress report? Should we start on the SQL user creation via AnyDesk now?**
