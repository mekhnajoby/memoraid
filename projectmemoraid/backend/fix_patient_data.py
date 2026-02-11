import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import User, PatientProfile, PatientCaregiver

def fix_and_inspect():
    # 1. Update Achamma Kurian's phone number
    email = "achammakurian@gmail.com"
    phone = "8632459496"
    
    try:
        user = User.objects.get(email=email)
        profile, created = PatientProfile.objects.get_or_create(user=user)
        profile.phone_number = phone
        profile.save()
        print(f"Updated phone for {email} to {phone}")
    except User.DoesNotExist:
        print(f"User {email} not found")

    # 2. Inspect links for caregiver mekhnajoby2005@gmail.com
    caregiver_email = "mekhnajoby2005@gmail.com"
    try:
        cg = User.objects.get(email=caregiver_email)
        links = PatientCaregiver.objects.filter(caregiver=cg)
        print(f"\nLinks for {caregiver_email}:")
        for l in links:
            print(f"- Patient: {l.patient.email}, Approved: {l.is_approved}, Status: {l.approval_status}")
    except User.DoesNotExist:
        print(f"Caregiver {caregiver_email} not found")

    # 3. Inspect all pending/rejected links
    print("\nAll Pending/Rejected Links:")
    all_links = PatientCaregiver.objects.exclude(approval_status='approved')
    for l in all_links:
        print(f"- P: {l.patient.email}, CG: {l.caregiver.email}, Status: {l.approval_status}")

if __name__ == "__main__":
    fix_and_inspect()
