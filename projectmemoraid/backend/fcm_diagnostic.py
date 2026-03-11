import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import FCMToken, PatientCaregiver, User

print("--- FCM Diagnostic ---")
print(f"Registered FCM Tokens: {FCMToken.objects.count()}")
print(f"Total Linked Caregivers: {PatientCaregiver.objects.filter(is_approved=True).count()}")

# Check Firebase Initialization
try:
    import firebase_admin
    from firebase_admin import messaging
    
    firebase_app = getattr(settings, 'FIREBASE_APP', None)
    if firebase_app:
        print("Backend Firebase App: INITIALIZED")
    else:
        print("Backend Firebase App: NOT INITIALIZED (Check service account or env var)")
        
    # Check if we can access the messaging service
    try:
        # This just checks if the module is ready, doesn't send anything
        firebase_admin.get_app()
        print("Firebase Admin Messaging: READY")
    except Exception as e:
        print(f"Firebase Admin Messaging: NOT READY ({e})")
        
except ImportError:
    print("firebase-admin library: NOT INSTALLED")
except Exception as e:
    print(f"Unexpected error: {e}")

print("----------------------")
