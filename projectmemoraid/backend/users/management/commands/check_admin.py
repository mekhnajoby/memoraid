from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Check Admin user status'

    def handle(self, *args, **options):
        email = 'admin@memoraid.com'
        try:
            user = User.objects.get(email=email)
            self.stdout.write(self.style.SUCCESS(f"User {email} found."))
            self.stdout.write(f"Role: {user.role}")
            self.stdout.write(f"Status: {user.status}")
            self.stdout.write(f"Is Active: {user.is_active}")
            self.stdout.write(f"Is Staff: {user.is_staff}")
            self.stdout.write(f"Is Superuser: {user.is_superuser}")
            self.stdout.write(f"Is Email Verified: {user.is_email_verified}")
            self.stdout.write(f"Has Usable Password: {user.has_usable_password()}")
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User {email} NOT found."))
        
        self.stdout.write(f"Total users: {User.objects.count()}")
