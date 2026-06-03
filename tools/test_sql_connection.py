import pyodbc
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

server = os.getenv('SQL_SERVER')
user = os.getenv('SQL_USER')
password = os.getenv('SQL_PASSWORD')
database = os.getenv('SQL_DATABASE', 'master')

# Try ODBC Driver 18 first (latest)
drivers = [
    '{ODBC Driver 18 for SQL Server}',
    '{ODBC Driver 17 for SQL Server}',
    '{SQL Server}'
]

def test_connection():
    success = False
    for driver in drivers:
        print(f"🔄 Attempting connection with {driver}...")
        connection_string = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={user};PWD={password};TrustServerCertificate=yes;Connection Timeout=10;'
        
        try:
            conn = pyodbc.connect(connection_string)
            print(f"✅ Success! Connected using {driver}")
            
            # List databases to help user identify the correct one
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sys.databases")
            dbs = cursor.fetchall()
            print("\n📂 Available Databases:")
            for db in dbs:
                print(f" - {db[0]}")
            
            conn.close()
            success = True
            break
        except Exception as e:
            print(f"❌ Failed with {driver}: {e}")
    
    if not success:
        print("\n🆘 All connection attempts failed. Check firewall, port 1433, and credentials.")

if __name__ == "__main__":
    test_connection()
