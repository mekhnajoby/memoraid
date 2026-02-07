import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from django.test import Client
from users.models import User

def diag():
    c = Client()
    # Find the caregiver
    caregiver = User.objects.filter(email='mekhnajoby2005@gmail.com').first()
    if not caregiver:
        print("Caregiver not found")
        return

    print(f"Logging in as {caregiver.email}...")
    c.force_login(caregiver)
    
    # Identify the patient ID. 
    # From previous logs we saw patient_id=3. Let's find the patient user object to be sure.
    # inspect_data.py showed patient unique_id MEM-1543.
    patient = User.objects.filter(unique_id='MEM-1543').first()
    if not patient:
        # fallback
        patient = User.objects.filter(email__startswith='achamma').first()
        
    pid = patient.id if patient else 3
    print(f"Requesting network for patient_id={pid}")
    
    try:
        response = c.get(f'/api/users/caregiver/network/?patient_id={pid}')
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Response Content (First 2000 chars):")
            print(response.content.decode('utf-8')[:2000])
        else:
            print("Success!")
            print(response.json())
    except Exception as e:
        print(f"Exception during request: {e}")

if __name__ == "__main__":
    diag()
