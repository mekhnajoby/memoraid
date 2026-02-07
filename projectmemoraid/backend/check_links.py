import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import PatientCaregiver

count = PatientCaregiver.objects.count()
pending = PatientCaregiver.objects.filter(is_approved=False).count()
print(f'Total links currently in DB: {count}')
print(f'Pending links currently in DB: {pending}')
