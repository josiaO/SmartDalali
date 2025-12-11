import sqlite3
import os
import glob

DB_PATH = 'db.sqlite3'

def reset_db():
    if not os.path.exists(DB_PATH):
        print("db.sqlite3 not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Drop tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'communications_%';")
    tables = cursor.fetchall()
    
    for table in tables:
        table_name = table[0]
        print(f"Dropping table {table_name}...")
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")

    # 2. Clear migration history
    print("Clearing migration history for 'communications'...")
    cursor.execute("DELETE FROM django_migrations WHERE app = 'communications'")

    conn.commit()
    conn.close()
    print("Database cleared.")

    # 3. Remove migration files
    migration_files = glob.glob('communications/migrations/00*.py')
    for f in migration_files:
        print(f"Removing {f}...")
        os.remove(f)

if __name__ == '__main__':
    reset_db()
