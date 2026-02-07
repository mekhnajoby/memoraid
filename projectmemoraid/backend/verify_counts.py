from django.utils import timezone
from users.models import User, TaskLog
from users.serializers import UserSerializer
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

def verify():
    u = User.objects.get(email='achammakurian@gmail.com')
    s = UserSerializer(u)
    d = s.data
    print(f"Pending: {d['pending_tasks']}")
    print(f"Missed: {d['missed_tasks']}")
    print(f"Total Left: {d['pending_tasks'] + d['missed_tasks']}")

if __name__ == "__main__":
    verify()
