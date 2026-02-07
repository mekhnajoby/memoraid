# Django management command to check and process escalations
# Run with: python manage.py check_escalations

from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import Routine, TaskLog, Alert, PatientCaregiver
from users.tasks import send_fcm_notification
import datetime


class Command(BaseCommand):
    help = 'Manually check for overdue routines and trigger escalations'

    def handle(self, *args, **options):
        now = timezone.now()
        self.stdout.write(f"Checking for escalations at {now}")
        
        # Find pending tasks that are overdue
        pending_tasks = TaskLog.objects.filter(
            status='pending',
            scheduled_datetime__lt=now
        ).select_related('routine', 'routine__patient')
        
        escalation_count = 0
        alert_count = 0
        
        for task in pending_tasks:
            routine = task.routine
            window_end = task.scheduled_datetime + datetime.timedelta(minutes=routine.max_response_window)
            
            # Check if max response window exceeded
            if now >= window_end:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Task {task.id}: {routine.name} - MISSED (scheduled: {task.scheduled_datetime}, window ended: {window_end})"
                    )
                )
                
                # Mark as missed
                task.status = 'missed'
                task.save()
                
                # Create Alert record
                alert = Alert.objects.create(
                    patient=routine.patient,
                    routine=routine,
                    type='missed_task',
                    message=f"{routine.name} at {routine.time.strftime('%I:%M %p')}"
                )
                alert_count += 1
                
                # Notify Caregivers if escalation enabled
                if routine.escalation_enabled:
                    caregivers = PatientCaregiver.objects.filter(
                        patient=routine.patient,
                        is_approved=True
                    )
                    
                    for link in caregivers:
                        send_fcm_notification(
                            user=link.caregiver,
                            title="Missed Routine Alert",
                            body=f"{routine.patient.full_name} missed: {routine.name}",
                            data={'task_id': str(task.id), 'type': 'escalation', 'alert_id': str(alert.id)}
                        )
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"    → Notified caregiver: {link.caregiver.full_name}"
                            )
                        )
                    
                    escalation_count += 1
            else:
                # Still within window - send reminder if needed
                minutes_since_scheduled = (now - task.scheduled_datetime).total_seconds() / 60
                minutes_since_last_alert = (now - task.timestamp).total_seconds() / 60
                
                if minutes_since_last_alert >= routine.alert_interval - 0.5:
                    send_fcm_notification(
                        user=routine.patient,
                        title=f"Time for {routine.name}",
                        body=f"Please remember to {routine.name}. Have you done it?",
                        data={'task_id': str(task.id), 'type': 'routine_reminder'}
                    )
                    task.alert_count += 1
                    task.save()
                    self.stdout.write(
                        self.style.NOTICE(
                            f"  Task {task.id}: {routine.name} - Sent reminder #{task.alert_count}"
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Complete: {escalation_count} escalations processed, {alert_count} alerts created"
            )
        )
