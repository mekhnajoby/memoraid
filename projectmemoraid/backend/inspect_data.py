import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import PatientCaregiver, PatientProfile, User

def check_data():
    try:
        # Get patient
        patient = User.objects.filter(unique_id='MEM-1543').first()
        if not patient:
            # Fallback
            patient = User.objects.filter(email__startswith='achamma').first()
            
        if not patient:
            print("Patient not found.")
            return

        print(f"Checking Patient: {patient.email} ({patient.unique_id})")
        
        # Check Profile
        if hasattr(patient, 'patient_profile'):
            pp = patient.patient_profile
            print("--- Profile Data ---")
            print(f"Emergency Name: {pp.emergency_contact_name}")
            print(f"Emergency Phone: {pp.emergency_contact_phone}")
            print(f"Consulting Doctor: {pp.consulting_doctor}")
        else:
            print("No Patient Profile found.")

        # Check Links
        links = PatientCaregiver.objects.filter(patient=patient)
        print(f"\n--- Links ({links.count()}) ---")
        for l in links:
            print(f"Caregiver: {l.caregiver.email}")
            print(f"Level: {l.level}")
            print(f"Approved: {l.is_approved}")
            print("-" * 20)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data()
