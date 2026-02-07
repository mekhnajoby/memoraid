import os
import django
import sys

# Add the project directory to sys.path
sys.path.append(r'd:\memoraid\projectmemoraid\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import User, CaregiverProfile, PatientCaregiver, PatientProfile

email = 'mekhnajoby2005@gmail.com'
output_file = r'd:\memoraid\projectmemoraid\backend\debug_output.txt'

with open(output_file, 'w') as f:
    try:
        user = User.objects.get(email=email)
        f.write(f"User: {user.email}, Role: {user.role}, Status: {user.status}\n")
        
        if hasattr(user, 'caregiver_profile'):
            cp = user.caregiver_profile
            f.write(f"CaregiverProfile Level: {cp.level}, Approved: {cp.is_approved}\n")
        else:
            f.write("No CaregiverProfile found.\n")
            
        links = PatientCaregiver.objects.filter(caregiver=user)
        f.write(f"PatientCaregiver links: {links.count()}\n")
        for link in links:
            f.write(f" - Patient: {link.patient.email}, Level: {link.level}, Approved: {link.is_approved}\n")
            
        # Check if any patient listed this email as primary
        p_profiles = PatientProfile.objects.filter(primary_caregiver_email=email)
        f.write(f"PatientProfiles listing this email: {p_profiles.count()}\n")
        for pp in p_profiles:
            f.write(f" - Patient Profile for: {pp.user.email}\n")

    except User.DoesNotExist:
        f.write(f"User {email} not found.\n")
