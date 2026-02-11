from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Initialize Admin user'

    def handle(self, *args, **options):
        email = 'admin@memoraid.com'
        password = 'Memoraid@2026'
        
        # Helper to create/update admin
        def setup_admin(email_addr, pwd, uname, fname):
            user, created = User.objects.get_or_create(
                email=email_addr,
                defaults={
                    'username': uname,
                    'full_name': fname,
                    'role': 'admin',
                    'status': 'active',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                    'is_email_verified': True
                }
            )
            user.set_password(pwd)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.is_email_verified = True
            user.status = 'active'
            user.role = 'admin'
            user.save()
            return created

        c1 = setup_admin(email, password, 'admin', 'System Admin')
        c2 = setup_admin('testadmin@memoraid.com', 'admin123', 'testadmin', 'Test Admin')
        
        if c1 or c2:
            self.stdout.write(self.style.SUCCESS(f'Successfully initialized admin users'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated admin users'))
