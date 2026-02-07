
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import PatientProfile, PatientMemory, PatientCaregiver

User = get_user_model()

def run():
    email = 'achammakurian@gmail.com'
    try:
        u = User.objects.get(email=email)
        print(f"USER: {u.email} (id: {u.id})")
        
        if hasattr(u, 'patient_profile'):
            pp = u.patient_profile
            print(f"PROFILE: found")
            print(f"  Familiar Name: '{pp.familiar_name}'")
            print(f"  Anchors: {pp.identity_anchors}")
        else:
            print("PROFILE: NOT FOUND")
            
        links = PatientCaregiver.objects.filter(patient=u)
        print(f"LINKS: {links.count()}")
        for l in links:
            print(f"  - Caregiver: {l.caregiver.email}, Approved: {l.is_approved}, Level: {l.level}")
            
        mems = PatientMemory.objects.filter(patient=u)
        print(f"MEMORIES: {mems.count()}")
        for m in mems:
            print(f"  - {m.caption} ({m.relationship_context})")
            
    except User.DoesNotExist:
        print(f"USER {email} NOT FOUND")

if __name__ == "__main__":
    run()
