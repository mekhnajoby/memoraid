import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv('.env')

DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT', 3306))

def get_admin_creds():
    try:
        conn = MySQLdb.connect(
            host=DB_HOST,
            user=DB_USER,
            passwd=DB_PASS,
            db=DB_NAME,
            port=DB_PORT
        )
        cursor = conn.cursor()
        cursor.execute("SELECT email, role, is_superuser, full_name, username FROM users_user WHERE role='admin' OR is_superuser=1")
        rows = cursor.fetchall()
        for row in rows:
            print(f"Email: {row[0]}, Role: {row[1]}, Superuser: {row[2]}, Name: {row[3]}, Username: {row[4]}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_admin_creds()
