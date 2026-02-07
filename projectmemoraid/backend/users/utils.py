import re
from rest_framework import serializers

DISPOSABLE_EMAIL_DOMAINS = [
    'mailinator.com',
    'yopmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'tempmail.com',
    'trashmail.com',
    'getairmail.com',
    'sharklasers.com',
    'mailnesia.com',
    'dispostable.com'
]

def validate_disposable_email(email):
    if not email:
        return
    domain = email.split('@')[-1].lower()
    if domain in DISPOSABLE_EMAIL_DOMAINS:
        raise serializers.ValidationError("Disposable email addresses are not allowed.")

def validate_phone_number(phone):
    if not phone:
        return
    if not re.match(r'^\d{10}$', phone):
        raise serializers.ValidationError("Phone number must be exactly 10 digits.")
