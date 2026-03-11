import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import PatientProfile, Routine, TaskLog

User = get_user_model()

print(f"Total Users: {User.objects.count()}")
print(f"Total Patient Profiles: {PatientProfile.objects.count()}")
print(f"Total Routines: {Routine.objects.count()}")
print(f"Total Task Logs: {TaskLog.objects.count()}")
