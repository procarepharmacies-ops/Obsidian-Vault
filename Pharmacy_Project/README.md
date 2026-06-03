# 🏥 Pharmacy OS - ProCare Pharmacy Dashboard

Welcome to the **Pharmacy OS** dashboard system! This project is designed to bridge live data from your real-time Microsoft SQL Server databases (Santa & Masala branches) and present it inside a high-performance, beautiful glassmorphism React dashboard.

This guide is written especially for beginners to help you set up and run everything step-by-step.

---

## 📂 Project Structure Overview

The project is split into two independent folders:
1. **`backend/`** - A Python FastAPI server that securely connects to your live MS SQL databases, queries real-time transactions, and serves them as clean JSON data.
2. **`frontend/`** - A Vite + React + TypeScript web app that fetches data from the backend and renders the interactive dashboard, charts, low stock lists, and animations.

---

## 📦 What Should I Install? (Prerequisites)

Before running the application, you need to download and install the following free software on your Windows 11 computer:

### 1. Python 3.10 or Higher (For the Backend)
*   **What is it:** Runs the backend API.
*   **Download Link:** [Python for Windows](https://www.python.org/downloads/)
*   **⚠️ IMPORTANT STEP DURING INSTALLATION:** When you run the Python installer, make sure to check the box at the bottom that says **"Add Python to PATH"** before clicking Install. If you miss this, your computer won't recognize Python commands.

### 2. Node.js LTS (For the Frontend)
*   **What is it:** Runs the React dashboard developer server.
*   **Download Link:** [Node.js Official Site](https://nodejs.org/) (Choose the **LTS (Long Term Support)** version, e.g., v18 or v20).
*   **Installation:** Run the downloaded installer and click Next through all default options.

### 3. Microsoft ODBC Driver for SQL Server (For Database Connection)
*   **What is it:** The system driver that allows Python's `pyodbc` package to communicate with your remote MS SQL databases (Santa & Masala).
*   **Download Link:** [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
*   **Installation:** Download the **x64 Windows installer** and run it using the default settings.

---

## ⚡ The Easy Way: Single-Click Launchers 🚀

We have created two simple shortcut scripts in the root directory so you don't have to write any commands in the terminal yourself:

1.  **Start the Backend:** Double-click the **`run_backend.bat`** file.
    *   *What it does:* It creates a Python virtual environment, installs `fastapi`, `uvicorn`, `pyodbc`, `python-dotenv`, and starts the database API on `http://127.0.0.1:8000`.
2.  **Start the Frontend:** Double-click the **`run_frontend.bat`** file.
    *   *What it does:* It automatically downloads your React libraries and boots the UI dashboard on `http://localhost:5173`.

Keep both command prompt windows open while using the dashboard. To stop them, simply close the command windows!

---

## 🛠️ The Manual Way: Detailed Terminal Commands

If you prefer to run the commands manually in your terminal, follow these steps:

### Part A: Setting up the Backend
1.  Open **Command Prompt (cmd)** or **PowerShell**.
2.  Navigate to the `backend` folder:
    ```cmd
    cd "c:\Users\Ahmed\Documents\Obsidian Vault\Pharmacy_Project\backend"
    ```
3.  Create a virtual Python environment (to keep dependencies isolated):
    ```cmd
    python -m venv venv
    ```
4.  Activate the virtual environment:
    ```cmd
    venv\Scripts\activate
    ```
5.  Install the required backend packages:
    ```cmd
    pip install fastapi uvicorn pyodbc python-dotenv pydantic
    ```
6.  Start the FastAPI backend server:
    ```cmd
    python -m uvicorn app.main:app --reload
    ```
    *   *Success Check:* Open your browser and go to `http://127.0.0.1:8000/docs`. You should see the interactive API Documentation page listing your endpoints.

---

### Part B: Setting up the Frontend
1.  Open a **second** Command Prompt window.
2.  Navigate to the `frontend` folder:
    ```cmd
    cd "c:\Users\Ahmed\Documents\Obsidian Vault\Pharmacy_Project\frontend"
    ```
3.  Install all JavaScript libraries and dependencies:
    ```cmd
    npm install
    ```
4.  Start the React developer server:
    ```cmd
    npm run dev
    ```
5.  Open your browser and navigate to the address shown (usually `http://localhost:5173`).
    *   *Success Check:* You will be greeted by the stunning, real-time glassmorphism **ProCare Pharmacy Dashboard**!

---

## 🔒 Where do Database Credentials live?

The database connection credentials are secure and kept outside of the shared source folder. 
They are loaded automatically from the file:
`c:\Users\Ahmed\Documents\Obsidian Vault\.env`

The environment variables defined inside this file are:
*   `SQL_SERVER` - The IP address and port of your database.
*   `SQL_USER` - The custom read-only user (`ahmedibrahim`).
*   `SQL_PASSWORD` - The database connection password.
*   `SQL_DATABASE` - The target database name (`stock`).

---

## 🎯 Developer Todo List & Project Roadmap

We have initialized a master [task_plan.md](file:///c:/Users/Ahmed/Documents/Obsidian%20Vault/Pharmacy_Project/task_plan.md) inside this directory, which breaks down our development roadmap. 

*   For architectural guidelines and invariants, see [claude.md](file:///c:/Users/Ahmed/Documents/Obsidian%20Vault/Pharmacy_Project/claude.md).
*   For data mapping details, see [data_dictionary.md](file:///c:/Users/Ahmed/Documents/Obsidian%20Vault/Pharmacy_Project/data_dictionary.md).
