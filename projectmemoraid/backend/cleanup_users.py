import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Delete specific users as requested
users_to_delete = ['test_patient@example.com', 'test_caregiver@example.com']
count, _ = User.objects.filter(email__in=users_to_delete).delete()
print(f"Deleted {count} users.")

# Optionally delete all if the above didn't find them (maybe usernames were different)
if count == 0:
    count, _ = User.objects.all().delete()
    print(f"Deleted all {count} users from database.")
