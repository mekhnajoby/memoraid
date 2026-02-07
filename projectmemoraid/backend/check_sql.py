import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT * FROM users_patientcaregiver")
    rows = cursor.fetchall()
    print(f'Total rows in users_patientcaregiver: {len(rows)}')
    for row in rows:
        print(row)

    cursor.execute("SELECT id, email, role FROM users_user WHERE email IN ('mekhnajoby2005@gmail.com', 'achammakurian@gmail.com')")
    users = cursor.fetchall()
    print('\nUsers involved:')
    for user in users:
        print(user)
