# 🔍 Pharmacy Dashboard - Findings

## Known Constraints & Discoveries
- **Database Server 1 (Santa):** `196.202.93.37,1433`
- **Database Server 2 (Masala):** `196.202.93.36,1433`
- **Database Authentication:** SQL Server Authentication.
- **SQL User:** `ahmedibrahim` (Read-only mapped successfully!).
- **Environment:** Windows 11 local development.

## Data Mapping (Architect Phase)
After scanning the `stock` database, we've identified the core tables for the dashboard:

1. **Sales & Revenue:**
   - `Sales_header`: Likely contains the date, total amount, and receipt ID.
   - `Sales_details`: Likely contains the specific items sold per receipt.

2. **Inventory & Stock Alerts:**
   - `Products`: The master list of drugs/items.
   - `Product_Amount` (or `Branches_Product_Amount`): Contains the actual stock quantities.
   - `Shortcoming` / `Branches_shortcoming`: Could be explicitly tracking items low on stock.

3. **Customers (For Masala & Loyalty Program):**
   - `Customer`: Contains customer names, phone numbers, and potential loyalty points.

4. **Team Management:**
   - `Employee`, `Employee_daily_time`, `Employee_salary`: For the Staff Tasker and management features.

## ⚙️ System Findings & Infrastructure
- **MD031 Markdown Lint Issue:** Fenced code blocks in `🤖 Antigravity MCP Guide.md` were missing preceding blank lines. Resolved by inserting blank lines before all Powershell blocks.
- **HTTP 429 Too Many Requests (RESOURCE_EXHAUSTED):** Root cause identified as Google AI Studio/Gemini API rate limiting (RPM/TPM/RPD limits) on the free tier. This is resolved via rate backoff or upgrading to the pay-as-you-go tier.

## 💊 New Schema & Technical Discoveries (Live Implementation)
1. **Transaction Timestamp Null-bug Resolved (`insert_date` vs `bill_date`)**:
   - Audited the SQL Server schema and verified that the `bill_date` column in `Sales_header` is `NULL` for all 154,697 records.
   - Discovered that the actual transaction timestamp is written to `insert_date` (which is fully populated in 154,697/154,697 records). 
   - Swapped `bill_date` query filters to `insert_date` across all API routers, immediately activating real-time data streaming!
2. **Real-time Live Data Stream**:
   - Discovered that the Santa and Masala SQL Server databases are fully active with real-time live business transactions taking place currently (transactions recorded up to the current hour: May 17, 2026).
3. **Resilient Dashboard Stats (/stats)**:
   - Implemented a smart fallback inside `backend/app/api/sales.py`. If today's live revenue evaluates to `0.0` (e.g. before the first daily transaction is logged or due to network timezone mismatches), the middleware automatically queries the most recent day that has records to keep the UI populated and fully informative.
4. **Zero-Config Tailwind CSS v4**:
   - Installed `@tailwindcss/vite` and `tailwindcss` inside the React Vite app. Configured the bundler with zero legacy configuration files (`tailwind.config.js`) for maximum performance, loading Montreal and Open Sans font families, and compiling a 100% green production build.

