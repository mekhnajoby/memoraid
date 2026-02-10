import os
import django
import datetime
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memoraid_backend.settings')
django.setup()

from users.models import Routine, User, PatientCaregiver
from django.db.models import Q

def test_filtering():
    print("### Testing Routine Date Filtering Logic ###")
    
    # Let's find a patient
    patient = User.objects.filter(role='patient').first()
    if not patient:
        print("No patient found for testing.")
        return
    
    # Create some test routines if they don't exist
    # 1. Daily
    r1, _ = Routine.objects.get_or_create(
        patient=patient, name="Daily Test", time="08:00:00",
        frequency='daily', is_deleted=False
    )
    # 2. Weekly (Monday)
    r2, _ = Routine.objects.get_or_create(
        patient=patient, name="Weekly Mon Test", time="09:00:00",
        frequency='weekly', days_of_week=[0], is_deleted=False
    )
    # 3. Once (Feb 15, 2026)
    target_date = datetime.date(2026, 2, 15)
    r3, _ = Routine.objects.get_or_create(
        patient=patient, name="Once Feb 15 Test", time="10:00:00",
        frequency='once', target_date=target_date, is_deleted=False
    )

    dates_to_test = [
        ('2026-02-09', 'Monday'), # Mon
        ('2026-02-10', 'Tuesday'), # Tue
        ('2026-02-15', 'Sunday'), # Specific Date
    ]

    for date_str, day_name in dates_to_test:
        print(f"\n--- Testing Date: {date_str} ({day_name}) ---")
        target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        weekday = target_date.weekday()
        
        routines = Routine.objects.filter(
            Q(patient=patient, is_deleted=False) &
            (
                Q(frequency='daily') |
                Q(frequency='custom') |
                Q(frequency='weekly', days_of_week__contains=weekday) |
                Q(frequency='once', target_date=target_date)
            )
        )
        
        print(f"Results for {date_str}:")
        for r in routines:
            print(f" - {r.name} ({r.frequency})")
        
        # Validation
        names = [r.name for r in routines]
        if date_str == '2026-02-09': # Monday
            assert "Daily Test" in names
            assert "Weekly Mon Test" in names
            assert "Once Feb 15 Test" not in names
        elif date_str == '2026-02-10': # Tuesday
            assert "Daily Test" in names
            assert "Weekly Mon Test" not in names
            assert "Once Feb 15 Test" not in names
        elif date_str == '2026-02-15': # Sunday
            assert "Daily Test" in names
            assert "Weekly Mon Test" not in names # Wait, Sunday is 6, Mon is 0. 
            assert "Once Feb 15 Test" in names
            
    print("\nBackend Logic Verification Successful!")

if __name__ == "__main__":
    test_filtering()
