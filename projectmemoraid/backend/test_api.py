import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.views import CaregiverDashboardStatsView
from rest_framework.test import APIRequestFactory, force_authenticate

User = get_user_model()
user = User.objects.get(email='mekhnajoby2005@gmail.com')

factory = APIRequestFactory()
request = factory.get('/api/users/caregiver/stats/')
force_authenticate(request, user=user)

view = CaregiverDashboardStatsView.as_view()
response = view(request)

print(f'Status Code: {response.status_code}')
print('Response Data:')
import json
print(json.dumps(response.data, indent=2))
