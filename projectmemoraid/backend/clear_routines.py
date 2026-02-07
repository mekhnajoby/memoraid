# Django shell script to clear all routines and related data
# Run with: Get-Content clear_routines.py | python manage.py shell

from users.models import Routine, TaskLog, Alert

print("Starting database cleanup...")

# Count before deletion
routine_count = Routine.objects.count()
tasklog_count = TaskLog.objects.count()
alert_count = Alert.objects.count()

print(f"\nBefore deletion:")
print(f"  Routines: {routine_count}")
print(f"  TaskLogs: {tasklog_count}")
print(f"  Alerts: {alert_count}")

# Delete all TaskLogs (they reference routines)
deleted_tasklogs = TaskLog.objects.all().delete()
print(f"\n✓ Deleted {deleted_tasklogs[0]} TaskLogs")

# Delete all Alerts
deleted_alerts = Alert.objects.all().delete()
print(f"✓ Deleted {deleted_alerts[0]} Alerts")

# Delete all Routines
deleted_routines = Routine.objects.all().delete()
print(f"✓ Deleted {deleted_routines[0]} Routines")

print("\n✓ Database cleanup complete!")
print("All routines, task logs, and alerts have been removed.")
