from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CaregiverProfile, PatientProfile, Inquiry, Routine, TaskLog, Alert, PatientMemory, FCMToken
from .utils import validate_disposable_email, validate_phone_number

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'username', 'password', 'confirm_password', 'role', 'unique_id']
        read_only_fields = ['unique_id']

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value

    def validate_email(self, value):
        validate_disposable_email(value)
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        import random
        import string
        from django.utils import timezone
        from datetime import timedelta

        # Generate Unique ID
        while True:
            uid = f"MEM-{''.join(random.choices(string.digits, k=4))}"
            if not User.objects.filter(unique_id=uid).exists():
                break
        
        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            role=validated_data['role'],
            status='pending',
            unique_id=uid,
            otp_code=otp,
            otp_expiry=timezone.now() + timedelta(minutes=10)
        )
        print(f"OTP for {user.email}: {otp}") # Simulating email send
        return user

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")
        
        # Dummy implementation: Accept any 6-digit code for development
        # if user.otp_code != data['code']:
        #     raise serializers.ValidationError("Invalid OTP code.")
        
        # if user.otp_expiry < timezone.now():
        #     raise serializers.ValidationError("OTP code expired. Please request a new one.")
        
        return data

class CaregiverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaregiverProfile
        fields = ['relationship', 'level', 'living_arrangement', 'phone_number', 'city', 'address']

    def validate_phone_number(self, value):
        validate_phone_number(value)
        return value

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            'dob', 'condition', 'stage', 'address', 'familiar_name', 'phone_number',
            'primary_caregiver_name', 'primary_caregiver_email', 'consulting_doctor', 
            'consulting_doctor_hospital', 'consulting_doctor_contact',
            'consulting_doctor_email',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'identity_anchors', 'care_notes', 'consulting_doctor_notes'
        ]

    def validate_primary_caregiver_email(self, value):
        validate_disposable_email(value)
        return value

class PatientMemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientMemory
        fields = ['id', 'patient', 'image', 'caption', 'relationship_context', 'created_at']
        read_only_fields = ['created_at']

class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routine
        fields = [
            'id', 'patient', 'name', 'time', 'frequency', 'days_of_week', 'target_date',
            'notes', 'icon', 'is_active', 'alert_interval', 
            'max_response_window', 'escalation_enabled', 'created_at'
        ]

class TaskLogSerializer(serializers.ModelSerializer):
    routine_name = serializers.CharField(source='routine.name', read_only=True)
    routine_time = serializers.TimeField(source='routine.time', read_only=True)
    routine_icon = serializers.CharField(source='routine.icon', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.full_name', read_only=True)
    handled_by_role = serializers.CharField(source='handled_by.role', read_only=True)
    
    class Meta:
        model = TaskLog
        fields = [
            'id', 'routine', 'routine_name', 'routine_time', 'routine_icon', 
            'date', 'scheduled_datetime', 
            'status', 'handled_by', 'handled_by_name', 'handled_by_role', 
            'acknowledged_at', 'timestamp'
        ]

class FCMTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMToken
        fields = ['token', 'device_id']

    def create(self, validated_data):
        user = self.context['request'].user
        token, created = FCMToken.objects.get_or_create(
            user=user,
            token=validated_data['token'],
            defaults={'device_id': validated_data.get('device_id')}
        )
        return token

class AlertSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.full_name', read_only=True)
    routine_name = serializers.CharField(source='routine.name', read_only=True)
    routine_time = serializers.TimeField(source='routine.time', read_only=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'patient', 'patient_name', 'routine', 'routine_name', 
            'routine_time', 'type', 'status', 'message', 'latitude', 
            'longitude', 'created_at', 'handled_by', 'handled_by_name'
        ]
        read_only_fields = ['patient', 'status', 'routine', 'handled_by']

class InquirySerializer(serializers.ModelSerializer):
    caregiver_email = serializers.EmailField(source='caregiver.email', read_only=True)
    caregiver_name = serializers.CharField(source='caregiver.full_name', read_only=True)
    caregiver_unique_id = serializers.CharField(source='caregiver.unique_id', read_only=True)

    class Meta:
        model = Inquiry
        fields = ['id', 'caregiver_email', 'caregiver_name', 'caregiver_unique_id', 'subject', 'message', 'priority', 'status', 'admin_response', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    caregiver_profile = CaregiverProfileSerializer(read_only=True)
    patient_profile = PatientProfileSerializer(read_only=True)
    memories = PatientMemorySerializer(many=True, read_only=True)
    linked_entities = serializers.SerializerMethodField()
    linked_entities_list = serializers.SerializerMethodField()
    care_level = serializers.SerializerMethodField()
    pending_tasks = serializers.SerializerMethodField()
    missed_tasks = serializers.SerializerMethodField()
    active_alerts = serializers.SerializerMethodField()
    escalated_tasks = serializers.SerializerMethodField()
    total_tasks_today = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    email_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'role', 'status', 'unique_id',
            'is_email_verified', 'caregiver_profile', 'patient_profile', 
            'linked_entities', 'linked_entities_list', 
            'care_level', 'pending_tasks', 'missed_tasks', 'active_alerts',
            'escalated_tasks', 'total_tasks_today',
            'profile_photo', 'memories', 'age', 'email_verified'
        ]
        read_only_fields = ['email', 'role', 'status']

    def get_linked_entities_list(self, obj):
        from .models import PatientCaregiver
        if obj.role == 'caregiver':
            links = obj.patient_links.all()
            result = []
            for link in links:
                patient = link.patient
                primary_link = PatientCaregiver.objects.filter(patient=patient, level='primary').first()
                primary_name = primary_link.caregiver.full_name if primary_link else "Unassigned"
                result.append({
                    "id": patient.id,
                    "name": patient.full_name,
                    "unique_id": patient.unique_id,
                    "role": "Patient",
                    "status": patient.status,
                    "is_approved": link.is_approved,
                    "primary_caregiver_name": primary_name
                })
            return result
        elif obj.role == 'patient':
            links = obj.caregiver_links.all()
            result = []
            for link in links:
                caregiver = link.caregiver
                rel = link.relationship
                if not rel and hasattr(link.caregiver, 'caregiver_profile'):
                    rel = link.caregiver.caregiver_profile.relationship

                result.append({
                    "id": caregiver.id,
                    "name": caregiver.full_name,
                    "unique_id": caregiver.unique_id,
                    "role": "Caregiver",
                    "level": link.level,
                    "relationship": rel.capitalize() if rel else "Caregiver",
                    "is_approved": link.is_approved,
                    "phone": link.caregiver.caregiver_profile.phone_number if hasattr(link.caregiver, 'caregiver_profile') else "—"
                })
            return result
        return []

    def get_linked_entities(self, obj):
        if obj.role == 'caregiver':
            links = obj.patient_links.all()
            if not links.exists():
                return "Not yet assigned"
            return ", ".join([f"{link.patient.full_name} (ID: {link.patient.unique_id or '—'})" for link in links])
        elif obj.role == 'patient':
            primary = obj.caregiver_links.filter(level='primary').first()
            secondaries = obj.caregiver_links.filter(level='secondary')
            
            parts = []
            if primary:
                rel = primary.relationship
                if not rel and hasattr(primary.caregiver, 'caregiver_profile'):
                    rel = primary.caregiver.caregiver_profile.relationship
                parts.append(f"Primary: {primary.caregiver.full_name} (ID: {primary.caregiver.unique_id or '—'}) ({rel or 'Caregiver'})")
            
            if secondaries.exists():
                sec_parts = []
                for s in secondaries:
                    s_rel = s.relationship
                    if not s_rel and hasattr(s.caregiver, 'caregiver_profile'):
                        s_rel = s.caregiver.caregiver_profile.relationship
                    sec_parts.append(f"{s.caregiver.full_name} (ID: {s.caregiver.unique_id or '—'}) ({s_rel or 'Caregiver'})")
                parts.append(f"Secondary: {', '.join(sec_parts)}")
            
            return " | ".join(parts) if parts else "No caregivers assigned"
        return "—"

    def get_care_level(self, obj):
        request = self.context.get('request')
        if request and request.user.role == 'caregiver' and obj.role == 'patient':
            from .models import PatientCaregiver
            link = PatientCaregiver.objects.filter(caregiver=request.user, patient=obj).first()
            if link:
                return f"{link.level.capitalize()} Caregiver"
        
        # If showing a caregiver's level to someone else (e.g. in a list)
        if obj.role == 'caregiver':
            request = self.context.get('request')
            
            # If the caregiver is viewing their own profile, return their global level
            if request and request.user == obj and hasattr(obj, 'caregiver_profile'):
                return f"{obj.caregiver_profile.level.capitalize()} Caregiver"
            
            # This is tricky because a caregiver might have different levels for different patients.
            # Usually, the 'request' context has a 'patient_id' if we are in a patient workspace.
            patient_id = self.context.get('patient_id')
            if patient_id:
                link = PatientCaregiver.objects.filter(caregiver=obj, patient_id=patient_id).first()
                if link:
                    return f"{link.level.capitalize()} Caregiver"
            
            # Fallback to the global profile level if no context
            if hasattr(obj, 'caregiver_profile'):
                return obj.caregiver_profile.get_level_display()
        
        return "—"

    def get_age(self, obj):
        if obj.role == 'patient' and hasattr(obj, 'patient_profile') and obj.patient_profile.dob:
            from datetime import date
            today = date.today()
            dob = obj.patient_profile.dob
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None

    def get_email_verified(self, obj):
        return obj.status in ['active', 'verified']

    def get_total_tasks_today(self, obj):
        if obj.role != 'patient':
            return 0
        from .models import TaskLog
        from django.utils import timezone
        today = timezone.now().date()
        # count all logs for today: pending, completed, missed, escalated
        return TaskLog.objects.filter(routine__patient=obj, date=today).count()

    def get_escalated_tasks(self, obj):
        if obj.role != 'patient':
            return 0
        from .models import TaskLog
        from django.utils import timezone
        today = timezone.now().date()
        return TaskLog.objects.filter(routine__patient=obj, date=today, status='escalated').count()
        
    def get_pending_tasks(self, obj):
        if obj.role != 'patient':
            return 0
        
        from django.utils import timezone
        from .models import TaskLog
        today = timezone.now().date()
        now_local = timezone.localtime(timezone.now())
        
        # Count actually scheduled tasks for today that are still pending and not yet overdue
        return TaskLog.objects.filter(
            routine__patient=obj,
            date=today,
            status='pending',
            scheduled_datetime__gt=now_local
        ).count()

    def get_missed_tasks(self, obj):
        if obj.role != 'patient':
            return 0
        
        from django.utils import timezone
        from .models import TaskLog, Alert
        today = timezone.now().date()
        now_local = timezone.localtime(timezone.now())
        
        # Count tasks marked as missed + pending tasks that are now past their scheduled time
        missed_count = TaskLog.objects.filter(
            routine__patient=obj,
            date=today,
            status='missed'
        ).count()
        
        overdue_pending = TaskLog.objects.filter(
            routine__patient=obj,
            date=today,
            status='pending',
            scheduled_datetime__lte=now_local
        ).count()
        
        total_missed = missed_count + overdue_pending
        
        return total_missed

    def get_active_alerts(self, obj):
        if obj.role != 'patient':
            return 0
        return Alert.objects.filter(patient=obj, status='active').count()

class PatientLinkingSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, write_only=True)
    email = serializers.EmailField(required=True, allow_blank=False, write_only=True)
    relationship = serializers.CharField(max_length=100, write_only=True)
    living_arrangement = serializers.CharField(max_length=100, write_only=True)
    care_context = serializers.CharField(max_length=100, write_only=True, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=500, write_only=True, required=False, allow_blank=True)
    consent_basis = serializers.CharField(max_length=100, write_only=True)
    risk_lives_alone = serializers.BooleanField(write_only=True, required=False, default=False)
    risk_wandering = serializers.BooleanField(write_only=True, required=False, default=False)
    phone_number = serializers.CharField(max_length=20, write_only=True, required=True)
    consent = serializers.BooleanField(required=True, write_only=True)

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Consent is mandatory to link a patient.")
        return value

    def create(self, validated_data):
        caregiver = self.context['request'].user
        full_name = validated_data['full_name']
        email = validated_data.get('email')
        
        # Check if user already exists
        patient_user = None
        if email and email.strip():
            try:
                patient_user = User.objects.get(email=email)
                if patient_user.role != 'patient':
                    raise serializers.ValidationError({"email": "This email is already registered with a non-patient account."})
            except User.DoesNotExist:
                pass

        if not patient_user:
            # Create a unique username for the patient
            import uuid
            username = email if email and email.strip() else f"patient_{uuid.uuid4().hex[:8]}"
            
            patient_user = User.objects.create_user(
                username=username,
                email=email if email and email.strip() else f"{username}@memoraid.local",
                password=uuid.uuid4().hex,
                full_name=full_name,
                role='patient',
                status='pending'
            )

            # Create Patient Profile
            from datetime import date
            PatientProfile.objects.get_or_create(
                user=patient_user,
                defaults={
                    'phone_number': validated_data.get('phone_number'),
                    'dob': date(1950, 1, 1),
                    'condition': 'dementia',
                    'stage': 'mild',
                    'primary_caregiver_email': caregiver.email
                }
            )

        # Create or update link. 
        # Manual linking via form makes the caregiver 'primary' for this patient,
        # but IT STILL REQUIRES ADMIN APPROVAL (is_approved=False).
        from .models import PatientCaregiver
        link, created = PatientCaregiver.objects.update_or_create(
            patient=patient_user, 
            caregiver=caregiver,
            defaults={
                'is_approved': False,
                'level': 'primary', # They are self-declaring as primary
                'relationship': validated_data.get('relationship', 'Caregiver'),
                'living_arrangement': validated_data.get('living_arrangement', ''),
                'care_context': validated_data.get('care_context', ''),
                'notes': validated_data.get('notes', ''),
                'consent_basis': validated_data.get('consent_basis', ''),
                'risk_lives_alone': validated_data.get('risk_lives_alone', False),
                'risk_wandering': validated_data.get('risk_wandering', False),
            }
        )
        
        if not created and link.is_approved:
            # If it already exists and is approved, inform the user
            raise serializers.ValidationError({"error": "You are already linked to this patient and your access is active."})
            
        return link
