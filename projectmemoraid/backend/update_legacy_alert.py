# Django shell script to update legacy alert data
# Run with: python manage.py shell < update_legacy_alert.py

from users.models import Alert, Routine
from django.utils import timezone
from datetime import timedelta

# Find the legacy alert with generic message
legacy_alerts = Alert.objects.filter(
    message="Caregiver acknowledged overdue task reminder",
    routine__isnull=True
)

print(f"Found {legacy_alerts.count()} legacy alerts to update")

for alert in legacy_alerts:
    print(f"\nProcessing alert ID {alert.id} for patient {alert.patient.full_name}")
    print(f"Created at: {alert.created_at}")
    
    # Find routines that were likely missed around the time this alert was created
    alert_date = alert.created_at.date()
    alert_time = timezone.localtime(alert.created_at).time()
    
    # Look for routines scheduled before the alert was created on that day
    candidate_routines = Routine.objects.filter(
        patient=alert.patient,
        is_active=True,
        time__lt=alert_time
    )
    
    if candidate_routines.exists():
        # Use the most recent routine before the alert time
        routine = candidate_routines.order_by('-time').first()
        
        # Update the alert
        alert.routine = routine
        alert.message = f"{routine.name} at {routine.time.strftime('%I:%M %p')}"
        alert.save()
        
        print(f"✓ Updated alert to: {alert.message}")
    else:
        print(f"⚠ No suitable routine found for this alert")

print("\n✓ Legacy alert update complete!")
