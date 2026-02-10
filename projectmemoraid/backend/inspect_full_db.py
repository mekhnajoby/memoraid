import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv('.env')

DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT', 3306))

def inspect_mysql():
    try:
        conn = MySQLdb.connect(
            host=DB_HOST,
            user=DB_USER,
            passwd=DB_PASS,
            db=DB_NAME,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        print("### MySQL Database Tables:")
        print(tables)
        print("\n" + "="*50 + "\n")

        key_tables = [
            'users_user', 
            'users_routine',
            'users_tasklog',
            'users_alert'
        ]

        for table in key_tables:
            if table in tables:
                print(f"### Table: {table}")
                cursor.execute(f"DESCRIBE {table}")
                columns = [col[0] for col in cursor.fetchall()]
                print(" | ".join(columns))
                print("-" * (len(columns) * 10))
                
                cursor.execute(f"SELECT * FROM {table} LIMIT 5")
                rows = cursor.fetchall()
                if not rows:
                    print("Table is empty.")
                else:
                    for row in rows:
                        print(" | ".join(str(val) for val in row))
                print("\n" + "-"*30 + "\n")

        conn.close()
    except Exception as e:
        print(f"Error inspecting MySQL: {e}")

if __name__ == "__main__":
    inspect_mysql()
