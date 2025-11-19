#!/usr/bin/env python3
import sqlite3
import sys

db_path = '/home/josiamosses/SmartDalali/backend/db.sqlite3'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print('=== User Email Report ===\n')
    
    # Query all users
    cursor.execute('SELECT id, username, email, is_superuser, is_active FROM auth_user ORDER BY id')
    users = cursor.fetchall()
    
    print(f'Total users: {len(users)}\n')
    print('ID  | Username             | Email                          | Superuser | Active')
    print('-' * 90)
    for user in users:
        print(f'{user["id"]:3d} | {user["username"]:20s} | {user["email"]:30s} | {str(user["is_superuser"]):9s} | {user["is_active"]}')
    
    print('\n=== Duplicate Email Check ===\n')
    
    # Check for duplicate emails
    cursor.execute('''
        SELECT email, COUNT(*) as count FROM auth_user 
        WHERE email IS NOT NULL AND email != '' 
        GROUP BY email 
        HAVING count > 1
    ''')
    duplicates = cursor.fetchall()
    
    if duplicates:
        print('⚠️  Found duplicate emails:')
        for dup in duplicates:
            email = dup['email']
            print(f'  Email: {email} ({dup["count"]} users)')
            cursor.execute('SELECT id, username FROM auth_user WHERE email = ?', (email,))
            for u in cursor.fetchall():
                print(f'    - ID: {u["id"]}, Username: {u["username"]}')
    else:
        print('✓ No duplicate emails found')
    
    print('\n=== Email Lookup Verification ===\n')
    
    # Test email lookups (case-insensitive)
    test_emails = ['johndoe@gmail.com', 'josia.obeid@gmail.com']
    for test_email in test_emails:
        cursor.execute('SELECT id, username FROM auth_user WHERE LOWER(email) = LOWER(?)', (test_email,))
        result = cursor.fetchall()
        if len(result) == 0:
            print(f'✗ No user found for "{test_email}"')
        elif len(result) == 1:
            u = result[0]
            print(f'✓ Lookup "{test_email}" -> Username: {u["username"]}, ID: {u["id"]}')
        else:
            print(f'✗ Multiple users found for "{test_email}" (data integrity issue)')
    
    conn.close()
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
