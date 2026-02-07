import sqlite3
import os

db_path = "db.sqlite3"

def inspect_db():
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print("### Database Tables:")
    print(tables)
    print("\n" + "="*50 + "\n")

    # Key tables to inspect
    key_tables = [
        'users_user', 
        'users_patientprofile', 
        'users_caregiverprofile', 
        'users_patientcaregiver',
        'users_routine',
        'users_tasklog',
        'users_alert'
    ]

    for table in key_tables:
        if table in tables:
            print(f"### Table: {table}")
            try:
                cursor.execute(f"PRAGMA table_info({table});")
                columns = [col[1] for col in cursor.fetchall()]
                print(" | ".join(columns))
                print("-" * (len(columns) * 10))
                
                cursor.execute(f"SELECT * FROM {table} LIMIT 5;")
                rows = cursor.fetchall()
                if not rows:
                    print("Table is empty.")
                else:
                    for row in rows:
                        print(" | ".join(str(val) for val in row))
            except Exception as e:
                print(f"Error reading table {table}: {e}")
            print("\n" + "-"*30 + "\n")
        else:
            print(f"Table {table} not found.")

    conn.close()

if __name__ == "__main__":
    inspect_db()
