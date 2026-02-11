from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Initialize Admin user'

    def handle(self, *args, **options):
        email = 'admin@memoraid.com'
        password = 'Memoraid@2026'
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': 'admin',
                'full_name': 'System Admin',
                'role': 'admin',
                'status': 'active',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'is_email_verified': True
            }
        )
        
        # Ensure credentials and flags are correct regardless of whether user was created or found
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.is_email_verified = True
        user.status = 'active'
        user.role = 'admin'
        user.save()
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin {email}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated admin {email}'))
