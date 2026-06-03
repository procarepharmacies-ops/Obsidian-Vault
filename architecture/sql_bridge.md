# 🌉 SQL Bridge SOP (Layer 2)

## 🎯 Goal
Provide a secure, read-only bridge between the SQL Server (`ahmedibrahim`) and the React Dashboard.

## 🛠️ Stack
- **API**: FastAPI (Python)
- **Driver**: `pyodbc`
- **Validation**: Pydantic v2
- **ORM**: SQLModel (Optional for speed, otherwise raw SQL with Pydantic mapping)

## 🔒 Security
- **Strictly Read-Only**: Use a DB user with limited permissions.
- **Environment Variables**: Store credentials in `.env`.
- **CORS**: Restrict access to the dashboard's local origin.

## 📡 Data Flow
1. React frontend requests `/api/v1/sales`.
2. FastAPI fetches data using `pyodbc`.
3. Pydantic validates and formats the data to EGP.
4. JSON payload delivered to UI.

## 🧪 Verification Step
Run `tools/test_sql_connection.py` to confirm connectivity before building full endpoints.
