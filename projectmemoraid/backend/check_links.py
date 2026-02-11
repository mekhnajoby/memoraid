import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import User, PatientCaregiver

print("--- User List ---")
for user in User.objects.all():
    print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}, Status: {user.status}")

print("\n--- PatientCaregiver Links ---")
for link in PatientCaregiver.objects.all():
    print(f"ID: {link.id}, Patient: {link.patient.email}, Caregiver: {link.caregiver.email}, Approved: {link.is_approved}, Level: {link.level}")
