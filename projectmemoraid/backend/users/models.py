from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('caregiver', 'Caregiver'),
        ('patient', 'Patient'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('disabled', 'Disabled'),
    )
    
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return f"{self.email} ({self.role})"

class CaregiverProfile(models.Model):
    LEVEL_CHOICES = (
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
    )
    RELATION_CHOICES = (
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('family', 'Family Member'),
        ('professional', 'Professional Caregiver'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='caregiver_profile')
    relationship = models.CharField(max_length=50, choices=RELATION_CHOICES)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    phone_number = models.CharField(max_length=20)
    city = models.CharField(max_length=100, blank=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile for {self.user.email}"

class PatientProfile(models.Model):
    CONDITION_CHOICES = (
        ('alzheimers', "Alzheimer's"),
        ('dementia', 'Dementia'),
    )
    STAGE_CHOICES = (
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    dob = models.DateField()
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    familiar_name = models.CharField(max_length=100, blank=True)
    primary_caregiver_email = models.EmailField()

    def __str__(self):
        return f"Patient Profile for {self.user.email}"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from django.utils import timezone
        import datetime
        # Valid for 1 hour
        return not self.is_used and self.created_at >= timezone.now() - datetime.timedelta(hours=1)

