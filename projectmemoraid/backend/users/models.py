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
        ('verified', 'Verified (Awaiting Approval)'),
        ('active', 'Active'),
        ('disabled', 'Disabled'),
    )
    
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    unique_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    
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
        ('other', 'Other'),
    )
    LIVING_CHOICES = (
        ('same_household', 'Same Household'),
        ('remote', 'Remote / Nearby'),
        ('facility', 'Assisted Living Facility'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='caregiver_profile')
    relationship = models.CharField(max_length=50, blank=True, null=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    living_arrangement = models.CharField(max_length=50, choices=LIVING_CHOICES, blank=True, null=True)
    phone_number = models.CharField(max_length=20)
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True, null=True)
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
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField()
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    address = models.TextField(blank=True, null=True)
    familiar_name = models.CharField(max_length=100, blank=True)
    primary_caregiver_name = models.CharField(max_length=255, blank=True, null=True)
    primary_caregiver_email = models.EmailField()
    consulting_doctor = models.CharField(max_length=255, blank=True, null=True)
    consulting_doctor_hospital = models.CharField(max_length=255, blank=True, null=True)
    consulting_doctor_contact = models.CharField(max_length=20, blank=True, null=True)
    consulting_doctor_email = models.EmailField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    identity_anchors = models.JSONField(default=list, blank=True, help_text="A list of reassuring facts/names for the patient.")
    care_notes = models.TextField(blank=True, null=True)
    consulting_doctor_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Patient Profile for {self.user.email}"

class Routine(models.Model):
    FREQUENCY_CHOICES = (
        ('daily', 'Every Day'),
        ('weekly', 'Specific Days'),
        ('custom', 'Flexible / Custom'),
    )
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routines', limit_choices_to={'role': 'patient'})
    name = models.CharField(max_length=255)
    time = models.TimeField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    days_of_week = models.JSONField(default=list, blank=True, help_text="List of days (0-6) for weekly routines")
    notes = models.TextField(blank=True, null=True, help_text="Instructions or additional notes for the routine")
    icon = models.CharField(max_length=50, default='activity') # Lucide icon name
    is_active = models.BooleanField(default=True)
    
    # Persistent Alert & Escalation Settings
    alert_interval = models.PositiveIntegerField(default=5, help_text="Interval between repeat alerts in minutes")
    max_response_window = models.PositiveIntegerField(default=30, help_text="Maximum window for patient response in minutes")
    escalation_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} for {self.patient.full_name}"

class TaskLog(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
        ('escalated', 'Escalated'),
    )
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='task_actions')
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now=True)
    alert_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('routine', 'date')

    def __str__(self):
        return f"{self.routine.name} - {self.date} ({self.status})"

class Alert(models.Model):
    TYPE_CHOICES = (
        ('missed_task', 'Missed Task'),
        ('sos', 'SOS Alert'),
        ('escalation', 'Escalation'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('handled', 'Handled'),
    )
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts', limit_choices_to={'role': 'patient'})
    routine = models.ForeignKey('Routine', on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts', help_text="Reference to the routine for missed_task alerts")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    message = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='alert_responses')

    def __str__(self):
        return f"{self.get_type_display()} for {self.patient.full_name}"

class PatientCaregiver(models.Model):
    LEVEL_CHOICES = (
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
    )
    APPROVAL_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='caregiver_links', limit_choices_to={'role': 'patient'})
    caregiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_links', limit_choices_to={'role': 'caregiver'})
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='secondary')
    relationship = models.CharField(max_length=50, blank=True, null=True)
    living_arrangement = models.CharField(max_length=50, blank=True, null=True)
    care_context = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    consent_basis = models.CharField(max_length=50, blank=True, null=True)
    risk_lives_alone = models.BooleanField(default=False)
    risk_wandering = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_links', limit_choices_to={'role': 'admin'})
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('patient', 'caregiver')

    def __str__(self):
        return f"Link: {self.patient.email} <-> {self.caregiver.email} ({'Approved' if self.is_approved else 'Pending'})"

class PatientMemory(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memories', limit_choices_to={'role': 'patient'})
    image = models.ImageField(upload_to='memories/')
    caption = models.CharField(max_length=255)
    relationship_context = models.CharField(max_length=100, blank=True, help_text="e.g. 'Your son', 'Your wedding day'")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Memory for {self.patient.full_name}: {self.caption}"

class Inquiry(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    )
    
    caregiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inquiries', limit_choices_to={'role': 'caregiver'})
    subject = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inquiry from {self.caregiver.email}: {self.subject}"

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

class FCMToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
    token = models.TextField()
    device_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'token')

    def __str__(self):
        return f"Token for {self.user.email}"

