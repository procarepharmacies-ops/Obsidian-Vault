# 🤖 Project Constitution (Pharmacy Dashboard)

## 1. Core Vision (North Star)

A comprehensive Streamlit OS showing daily revenue, low stock alerts (Santa & Masala), team management, and AI predictive actions (purchasing, OTC recommendations, drug-drug interactions). Integrated with a WhatsApp-automated loyalty program.

## 2. Deployment Trajectory

1. **Windows 11:** MVP Dashboard + SQL Server connection.
2. **Fedora Workstation:** AI Integrations (Claude Pro / Local AI).
3. **Cloudflare:** Secure remote access (Zero Trust) deployment.

## 3. Data Schemas & Brand Tokens

- **Sales Data Schema (DailyRevenue)**:
```json
{
  "date": "string (ISO-8601)",
  "revenue_egp": "float",
  "branch": "string (Arabic/English branch name)"
}
```
- **Dashboard Stats Schema (DashboardStats)**:
```json
{
  "today_revenue": "float",
  "today_transactions": "integer",
  "low_stock_count": "integer"
}
```
- **Recent Transaction Schema (RecentTransaction)**:
```json
{
  "sales_id": "float",
  "bill_number": "string",
  "total_bill_net": "float",
  "bill_date": "string (ISO-8601)",
  "branch_name": "string"
}
```
- **Inventory Data Schema (InventoryItem)**:
```json
{
  "product_id": "float",
  "product_code": "string",
  "name_ar": "string",
  "name_en": "string",
  "stock_amount": "float",
  "sell_price": "float",
  "expiry_date": "string (ISO-8601) or null"
}
```
- **Brand Colors:** ProBlue `#0c72bc`, ProGreen `#8BC34A`
- **Typography:** Montserrat (Headings), Open Sans (Body)

## 4. Behavioral Rules

- **Rule 1:** STRICTLY Read-Only access to the SQL Database.
- **Rule 2**: All currency MUST be displayed in EGP.
- **Rule 3**: Obsidian is the central memory and task tracking system.
- **Rule 4**: Glassmorphism UI with smooth "pulse" animations.
- **Rule 5**: Antigravity (Maestro) manages all execution; high-level strategy can be imported from Claude Pro.

## 5. Architectural Invariants
- **Layer 1 (UI):** React + Vite + TailwindCSS v4
- **Layer 2 (API):** Python Backend (SQL bridging)
- **Layer 3 (Automation):** n8n (Future)
