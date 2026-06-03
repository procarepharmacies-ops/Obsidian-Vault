import pyodbc
import os
import json
from dotenv import load_dotenv

load_dotenv()

server = os.getenv('SQL_SERVER')
user = os.getenv('SQL_USER')
password = os.getenv('SQL_PASSWORD')
database = os.getenv('SQL_DATABASE')
driver = '{ODBC Driver 18 for SQL Server}'

def map_schema():
    connection_string = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={user};PWD={password};TrustServerCertificate=yes;'
    
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
        tables = [row[0] for row in cursor.fetchall()]
        
        schema = {}
        for table in tables:
            print(f"🔍 Mapping table: {table}")
            cursor.execute(f"SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'")
            columns = {row[0]: row[1] for row in cursor.fetchall()}
            schema[table] = columns
        
        # Save schema to .tmp for reference
        os.makedirs('.tmp', exist_ok=True)
        with open('.tmp/sql_schema.json', 'w') as f:
            json.dump(schema, f, indent=2)
        
        print("\n✅ Schema mapped successfully! Saved to .tmp/sql_schema.json")
        for table, cols in schema.items():
            print(f"\n📋 Table: {table}")
            for col, dtype in cols.items():
                print(f"  - {col} ({dtype})")
                
        conn.close()
    except Exception as e:
        print(f"❌ Mapping Failed: {e}")

if __name__ == "__main__":
    map_schema()
