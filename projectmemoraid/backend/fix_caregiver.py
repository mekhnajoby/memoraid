import os
import django
import sys

# Add the project directory to sys.path
sys.path.append(r'd:\memoraid\projectmemoraid\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import User, PatientCaregiver, TaskLog, Routine

email = 'mekhnajoby2005@gmail.com'
patient_email = 'achammakurian@gmail.com'

try:
    user = User.objects.get(email=email)
    patient = User.objects.get(email=patient_email)
    
    # Fix the link level
    link = PatientCaregiver.objects.filter(caregiver=user, patient=patient).first()
    if link:
        print(f"Old level: {link.level}")
        link.level = 'primary'
        link.save()
        print(f"New level: {link.level}")
    else:
        print("Link not found.")
        
    # Check logs
    logs = TaskLog.objects.filter(routine__patient=patient).order_by('-timestamp')[:5]
    print(f"Found {logs.count()} logs for patient.")
    for l in logs:
        print(f"Log: {l.routine.name}, Date: {l.date}, Timestamp: {l.timestamp}, Status: {l.status}")

except Exception as e:
    print(f"Error: {e}")
