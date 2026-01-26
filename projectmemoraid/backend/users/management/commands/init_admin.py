from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Initialize Admin user'

    def handle(self, *args, **options):
        email = 'admin@memoraid.com'
        password = 'Memoraid@2026'
        
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                username='admin',
                email=email,
                password=password,
                full_name='System Admin',
                role='admin',
                status='active'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin {email} already exists'))
