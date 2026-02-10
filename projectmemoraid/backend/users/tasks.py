import logging
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from users.models import Routine, TaskLog, FCMToken, User, Alert, PatientCaregiver
from firebase_admin import messaging
import datetime

logger = logging.getLogger(__name__)

def send_fcm_notification(user, title, body, data=None):
    """
    Helper function to send FCM notifications to all registered tokens for a user.
    """
    tokens = FCMToken.objects.filter(user=user).values_list('token', flat=True)
    if not tokens:
        logger.warning(f"No FCM tokens found for user {user.email}")
        return

    message_data = data or {}
    
    # Send to each token
    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=message_data,
                token=token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default',
                        default_vibrate_timings=True,
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(sound='default'),
                    ),
                ),
            )
            response = messaging.send(message)
            logger.info(f"Successfully sent notification: {response}")
        except Exception as e:
            logger.error(f"Error sending FCM notification to {user.email}: {e}")

@shared_task
def generate_daily_task_instances(target_date=None):
    """
    Generates TaskLog entries for a specific day for all active routines.
    Defaults to today if no date provided.
    """
    date_to_process = target_date if target_date else timezone.now().date()
    routines = Routine.objects.filter(is_active=True, is_deleted=False)
    
    created_count = 0
    for routine in routines:
        # Check frequency
        should_create = False
        if routine.frequency == 'daily' or routine.frequency == 'custom':
            should_create = True
        elif routine.frequency == 'weekly':
            # weekday() 0-6 (Mon-Sun)
            weekday = date_to_process.weekday()
            if weekday in routine.days_of_week:
                should_create = True
        elif routine.frequency == 'once':
            if routine.target_date == date_to_process:
                should_create = True
        
        if should_create:
            # Construct scheduled datetime
            scheduled_time = routine.time
            scheduled_datetime = timezone.make_aware(
                datetime.datetime.combine(date_to_process, scheduled_time)
            )
            
            # Create TaskLog if not already exists
            log, created = TaskLog.objects.get_or_create(
                routine=routine,
                date=date_to_process,
                defaults={'scheduled_datetime': scheduled_datetime, 'status': 'pending'}
            )
            if created:
                created_count += 1
                
    return f"Generated {created_count} task instances for {date_to_process}"

@shared_task
def trigger_persistent_alerts():
    """
    Triggers repeat notifications for pending tasks.
    Runs every minute.
    """
    now = timezone.now()
    # Find pending tasks where scheduled_datetime <= now
    # AND (last timestamp was more than alert_interval ago OR no alerts sent yet)
    # Actually, we can use a simpler approach: 
    # Check tasks that are due and haven't been acknowledged.
    
    pending_tasks = TaskLog.objects.filter(
        status='pending',
        scheduled_datetime__lte=now
    )
    
    alert_count = 0
    for task in pending_tasks:
        routine = task.routine
        # Check if max response window exceeded - handled by process_escalations
        # But here we only send alert if it's within window
        window_end = task.scheduled_datetime + datetime.timedelta(minutes=routine.max_response_window)
        
        if now < window_end:
            # Check the interval since scheduled time or last alert
            # We use task.timestamp as the time of the last alert (since we save() after sending)
            should_alert = False
            if task.alert_count == 0:
                should_alert = True
            else:
                minutes_since_last = (now - task.timestamp).total_seconds() / 60
                if minutes_since_last >= routine.alert_interval - 0.1: # 6s buffer
                    should_alert = True
            
            if should_alert:
                # Send high-priority notification to patient
                send_fcm_notification(
                    user=routine.patient,
                    title=f"Time for {routine.name}",
                    body=f"It is time for your routine: {routine.name}. Have you completed it?",
                    data={'task_id': str(task.id), 'type': 'routine_reminder'}
                )
                # Update timestamp and increment alert count
                task.alert_count += 1
                task.save() # This updates auto_now=True timestamp
                alert_count += 1
                
    return f"Sent {alert_count} persistent alerts"

@shared_task
def process_escalations():
    """
    Marks tasks as 'missed' and notifies caregivers if the window is exceeded.
    Runs every minute.
    """
    now = timezone.now()
    
    # Tasks that are still pending but past their max response window
    missed_tasks = TaskLog.objects.filter(
        status='pending',
        scheduled_datetime__lt=now - datetime.timedelta(minutes=1) # Small buffer
    ).select_related('routine', 'routine__patient')
    
    escalation_count = 0
    for task in missed_tasks:
        routine = task.routine
        window_end = task.scheduled_datetime + datetime.timedelta(minutes=routine.max_response_window)
        
        if now >= window_end:
            # Mark as missed
            task.status = 'missed'
            task.save()
            
            # Create Alert record
            Alert.objects.create(
                patient=routine.patient,
                type='missed_task',
                routine=routine,
                message=f"Routine '{routine.name}' scheduled at {timezone.localtime(task.scheduled_datetime).strftime('%I:%M %p')} was missed."
            )
            
            # Notify Caregivers
            if routine.escalation_enabled:
                caregivers = PatientCaregiver.objects.filter(patient=routine.patient, is_approved=True)
                for link in caregivers:
                    # Notify both primary and secondary (or handle staging if needed)
                    # Requirement says Primary immediate, Secondary optional delay or parallel.
                    # We'll notify all linked caregivers for now.
                    send_fcm_notification(
                        user=link.caregiver,
                        title="Incomplete Routine Alert",
                        body=f"{routine.patient.full_name} missed their routine: {routine.name}.",
                        data={'task_id': str(task.id), 'type': 'escalation'}
                    )
                
                # Also notify Admins
                admins = User.objects.filter(role='admin')
                for admin in admins:
                    send_fcm_notification(
                        user=admin,
                        title="Alert: Missed Routine (Admin)",
                        body=f"{routine.patient.full_name} missed routine: {routine.name}.",
                        data={'task_id': str(task.id), 'type': 'escalation'}
                    )
            escalation_count += 1
            
    return f"Processed {escalation_count} escalations"
