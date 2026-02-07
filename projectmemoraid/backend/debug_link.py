import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import PatientCaregiver, PatientProfile, CaregiverProfile

User = get_user_model()

cg_email = 'mekhnajoby2005@gmail.com'
pt_email = 'achammakurian@gmail.com'

cg = User.objects.filter(email=cg_email).first()
pt = User.objects.filter(email=pt_email).first()

with open('debug_results_v2.txt', 'w') as f:
    f.write('--- Caregiver Check ---\n')
    if cg:
        f.write(f'Email: {cg.email}\n')
        f.write(f'Role: {cg.role}\n')
        f.write(f'ID: {cg.id}\n')
        f.write(f'Status: {cg.status}\n')
        try:
            profile = cg.caregiver_profile
            f.write(f'Caregiver Level: {profile.level}\n')
        except:
            f.write('Caregiver has NO profile!\n')
    else:
        f.write(f'Caregiver {cg_email} NOT FOUND\n')

    f.write('\n--- Patient Check ---\n')
    if pt:
        f.write(f'Email: {pt.email}\n')
        f.write(f'Role: {pt.role}\n')
        f.write(f'ID: {pt.id}\n')
        f.write(f'Status: {pt.status}\n')
        try:
            profile = pt.patient_profile
            f.write(f'Primary CG Email in Profile: {profile.primary_caregiver_email}\n')
        except:
            f.write('Patient has NO profile!\n')
    else:
        f.write(f'Patient {pt_email} NOT FOUND\n')

    f.write('\n--- Link Check ---\n')
    if cg and pt:
        links = PatientCaregiver.objects.filter(caregiver=cg, patient=pt)
        f.write(f'Found {links.count()} link(s).\n')
        for link in links:
            f.write(f'Link ID: {link.id}, Is Approved: {link.is_approved}, Created: {link.created_at}\n')
    
    f.write('\n--- All Links for this Caregiver ---\n')
    if cg:
        all_links = PatientCaregiver.objects.filter(caregiver=cg)
        f.write(f'Caregiver has {all_links.count()} total link(s).\n')
        for link in all_links:
            f.write(f'  - Linked to Patient: {link.patient.email}, Approved: {link.is_approved}\n')
