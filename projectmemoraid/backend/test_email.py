import os
import django
from django.conf import settings
from django.core.mail import send_mail
import smtplib

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

def diagnostic_test():
    print(f"DEBUG: settings.EMAIL_HOST = {settings.EMAIL_HOST}")
    print(f"DEBUG: settings.EMAIL_PORT = {settings.EMAIL_PORT}")
    print(f"DEBUG: settings.EMAIL_HOST_USER = {settings.EMAIL_HOST_USER}")
    print(f"DEBUG: settings.DEFAULT_FROM_EMAIL = {settings.DEFAULT_FROM_EMAIL}")
    
    key = settings.EMAIL_HOST_PASSWORD
    if key:
        print(f"DEBUG: API Key exists and starts with: {key[:5]}...")
    else:
        print("DEBUG: API Key is MISSING!")

    recipient = "mekhnajoby2005@gmail.com"
    print(f"\nAttempting to send test email to: {recipient}")
    
    try:
        res = send_mail(
            'Memoraid SMTP Diagnostic',
            'This is a test email from the Memoraid diagnostic script.',
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        print(f"SUCCESS! Result code: {res}")
    except smtplib.SMTPDataError as e:
        print(f"\nFAILURE: SMTP Data Error occurred.")
        print(f"Error Code: {e.smtp_code}")
        print(f"Error Message: {e.smtp_error.decode()}")
    except Exception as e:
        print(f"\nFAILURE: General exception occurred.")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")

if __name__ == "__main__":
    diagnostic_test()
