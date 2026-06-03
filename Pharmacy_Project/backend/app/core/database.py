import pyodbc
import os
from dotenv import load_dotenv

# Load from root .env (handling absolute path)
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(dotenv_path)

USER = os.getenv('SQL_USER')
PASSWORD = os.getenv('SQL_PASSWORD')
DATABASE = os.getenv('SQL_DATABASE')
DRIVER = '{ODBC Driver 18 for SQL Server}'

# Define branch database server IPs
SANTA_SERVER = "196.202.93.37,1433"
MASALA_SERVER = "196.202.93.36,1433"

def get_db_connection(server_ip=None):
    if server_ip is None:
        server_ip = os.getenv('SQL_SERVER', SANTA_SERVER)
        
    connection_string = f'DRIVER={DRIVER};SERVER={server_ip};DATABASE={DATABASE};UID={USER};PWD={PASSWORD};TrustServerCertificate=yes;Connect Timeout=3;'
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"❌ Database Connection Error ({server_ip}): {e}")
        raise

