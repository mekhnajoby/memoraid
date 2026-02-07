import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import PatientCaregiver

deleted, _ = PatientCaregiver.objects.filter(is_approved=False).delete()
print(f'Successfully deleted {deleted} pending link requests.')
