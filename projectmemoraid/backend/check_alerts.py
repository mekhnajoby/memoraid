import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import Alert

print("Checking last 5 alerts:")
for alert in Alert.objects.all().order_by('-created_at')[:5]:
    print(f"ID: {alert.id}, Type: {alert.type}, Status: {alert.status}, Lat: {alert.latitude}, Lng: {alert.longitude}, Created: {alert.created_at}")
