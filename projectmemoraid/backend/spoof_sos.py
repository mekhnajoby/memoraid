import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Alert
from rest_framework.test import APIRequestFactory, force_authenticate
from users.views import AlertViewSet

User = get_user_model()
# Get a patient user
patient = User.objects.filter(role='patient').first()

if not patient:
    print("No patient user found.")
else:
    print(f"Sending test SOS for {patient.email}")
    factory = APIRequestFactory()
    # Using the patient's own endpoint or the collective one
    request = factory.post('/api/users/caregiver/alerts/', {
        'type': 'sos',
        'message': 'TEST ALERT WITH COORDINATES',
        'latitude': 40.7128,
        'longitude': -74.0060
    }, format='json')
    
    force_authenticate(request, user=patient)
    
    view = AlertViewSet.as_view({'post': 'create'})
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data}")
