from rest_framework import generics, status, permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import F, Q
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from . import serializers as users_serializers
from .models import CaregiverProfile, PatientProfile, PatientCaregiver, Inquiry, Routine, TaskLog, Alert, PatientMemory, FCMToken

User = get_user_model()
import datetime
from .tasks import process_escalations, trigger_persistent_alerts, generate_daily_task_instances

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = users_serializers.UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Registration successful. Please check your email for the OTP code.",
                "email": user.email,
                "unique_id": user.unique_id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = users_serializers.VerifyOTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.get(email=serializer.validated_data['email'])
            user.is_email_verified = True
            user.otp_code = None # Clear after use
            user.save()
            
            return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            serializer = users_serializers.UserSerializer(user)
            response.data['user'] = serializer.data
        return response

class OnboardingView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        user = request.user
        role = user.role
        
        if role == 'caregiver':
            serializer = users_serializers.CaregiverProfileSerializer(data=request.data)
            if serializer.is_valid():
                CaregiverProfile.objects.update_or_create(user=user, defaults=serializer.validated_data)
                
                # Set caregiver to verified (awaiting admin approval)
                user.status = 'verified'
                user.save()
                
                # Check for patients who listed this caregiver's email
                patients = PatientProfile.objects.filter(primary_caregiver_email=user.email)
                for p_profile in patients:
                    # If this caregiver was explicitly listed as primary by the patient, set level to primary
                    PatientCaregiver.objects.update_or_create(
                        patient=p_profile.user, 
                        caregiver=user,
                        defaults={
                            'level': 'primary' if p_profile.primary_caregiver_email == user.email else 'secondary',
                            'relationship': serializer.validated_data.get('relationship', 'Caregiver'),
                            'living_arrangement': serializer.validated_data.get('living_arrangement', '')
                        }
                    )

                user.refresh_from_db()
                return Response(users_serializers.UserSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif role == 'patient':
            serializer = users_serializers.PatientProfileSerializer(data=request.data)
            if serializer.is_valid():
                PatientProfile.objects.update_or_create(user=user, defaults=serializer.validated_data)
                
                # Set patient to verified
                user.status = 'verified'
                user.save()

                # Check if the primary caregiver already exists in the system
                caregiver_email = serializer.validated_data.get('primary_caregiver_email')
                try:
                    caregiver = User.objects.get(email=caregiver_email, role='caregiver')
                    PatientCaregiver.objects.update_or_create(
                        patient=user, 
                        caregiver=caregiver,
                        defaults={'level': 'primary'}
                    )
                except User.DoesNotExist:
                    # Caregiver not in system yet, link will be created when they join
                    pass

                user.refresh_from_db()
                return Response(users_serializers.UserSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    def patch(self, request):
        user = request.user
        target_patient_id = request.data.get('target_patient_id')
        
        # Scenario 1: Caregiver updating their own profile
        if user.role == 'caregiver' and not target_patient_id:
            profile_data = request.data.get('caregiver_profile', {})
            if profile_data:
                serializer = users_serializers.CaregiverProfileSerializer(user.caregiver_profile, data=profile_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
            
            # Also allow updating common user fields like full_name
            if 'full_name' in request.data:
                user.full_name = request.data['full_name']
                user.save()
            
            return Response(users_serializers.UserSerializer(user).data)
            
        # Scenario 2: Caregiver updating a linked patient's profile
        if user.role == 'caregiver' and target_patient_id:
            from .models import PatientCaregiver
            link = PatientCaregiver.objects.filter(caregiver=user, patient_id=target_patient_id, is_approved=True).first()
            if not link:
                return Response({"error": "Unauthorized or patient not linked"}, status=status.HTTP_403_FORBIDDEN)
            
            if link.level != 'primary':
                return Response({"error": "Only primary caregivers can update patient clinical data"}, status=status.HTTP_403_FORBIDDEN)
            
            patient = link.patient
            pp_data = request.data.get('patient_profile', {})
            
            if pp_data:
                serializer = users_serializers.PatientProfileSerializer(patient.patient_profile, data=pp_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    patient.refresh_from_db()
                    return Response(users_serializers.UserSerializer(patient).data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        # Scenario 3: Patient updating their own profile
        if user.role == 'patient':
            pp_data = request.data.get('patient_profile', {})
            if pp_data:
                serializer = users_serializers.PatientProfileSerializer(user.patient_profile, data=pp_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(users_serializers.UserSerializer(user).data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

class AdminStatsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        # Trigger background tasks synchronously to ensure stats are fresh
        try:
            generate_daily_task_instances()
            trigger_persistent_alerts()
            process_escalations()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error triggering tasks: {e}")

        stats = {
            "total_users": User.objects.exclude(role='admin').count(),
            "total_caregivers": User.objects.filter(role='caregiver').count(),
            "total_patients": User.objects.filter(role='patient').count(),
            "pending_approvals": PatientCaregiver.objects.filter(is_approved=False).count(),
            "open_inquiries": Inquiry.objects.filter(status='open').count(),
            "active_alerts": Alert.objects.filter(status="active").count(),
        }
        return Response(stats)

class AdminUserListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = users_serializers.UserSerializer
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.none()
        return User.objects.exclude(role='admin').order_by('-date_joined')

class AdminUserStatusView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user = User.objects.get(pk=pk)
            new_status = request.data.get('status')
            if new_status in dict(User.STATUS_CHOICES):
                user.status = new_status
                user.save()
                return Response(users_serializers.UserSerializer(user).data)
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminPendingApprovalsView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        links = PatientCaregiver.objects.filter(approval_status='pending')
        data = []
        for link in links:
            rel = link.relationship
            living = link.living_arrangement
            
            # Fallback to caregiver profile if link data is missing (e.g. from registration/onboarding)
            if not rel and hasattr(link.caregiver, 'caregiver_profile'):
                rel = link.caregiver.caregiver_profile.relationship or ''
            if not living and hasattr(link.caregiver, 'caregiver_profile'):
                living = link.caregiver.caregiver_profile.living_arrangement or ''

            item = {
                "id": link.id,
                "patient": users_serializers.UserSerializer(link.patient).data,
                "caregiver": users_serializers.UserSerializer(link.caregiver).data,
                "level": link.level,
                "relationship": rel,
                "living_arrangement": living,
                "care_context": link.care_context,
                "notes": link.notes,
                "consent_basis": link.consent_basis,
                "risk_lives_alone": link.risk_lives_alone,
                "risk_wandering": link.risk_wandering,
                "created_at": link.created_at
            }
            data.append(item)
        return Response(data)

class AdminApproveLinkView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            from django.utils import timezone
            link = PatientCaregiver.objects.get(pk=pk)
            action = request.data.get('action') # 'approve' or 'reject'
            
            if action == 'approve':
                link.is_approved = True
                link.approval_status = 'approved'
                link.approved_by = request.user
                link.approved_at = timezone.now()
                link.save()
                return Response({"message": "Link approved successfully"})
            elif action == 'reject':
                # Preserve rejected links for history instead of deleting
                link.is_approved = False
                link.approval_status = 'rejected'
                link.approved_by = request.user
                link.approved_at = timezone.now()
                link.rejection_reason = request.data.get('reason', '')
                link.save()
                return Response({"message": "Link rejected"})
            elif action == 'revoke':
                # Reset link back to pending status
                link.is_approved = False
                link.approval_status = 'pending'
                link.approved_by = None
                link.approved_at = None
                link.rejection_reason = None
                link.save()
                return Response({"message": "Link revoked and returned to pending queue"})
                
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        except PatientCaregiver.DoesNotExist:
            return Response({"error": "Link not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminApprovalHistoryView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all approved or rejected links
        processed_links = PatientCaregiver.objects.filter(
            approval_status__in=['approved', 'rejected']
        ).order_by('-approved_at')
        
        data = []
        for link in processed_links:
            rel = link.relationship
            living = link.living_arrangement
            
            if not rel and hasattr(link.caregiver, 'caregiver_profile'):
                rel = link.caregiver.caregiver_profile.relationship or ''
            if not living and hasattr(link.caregiver, 'caregiver_profile'):
                living = link.caregiver.caregiver_profile.living_arrangement or ''
            
            item = {
                "id": link.id,
                "patient": users_serializers.UserSerializer(link.patient).data,
                "caregiver": users_serializers.UserSerializer(link.caregiver).data,
                "level": link.level,
                "relationship": rel,
                "living_arrangement": living,
                "care_context": link.care_context,
                "notes": link.notes,
                "consent_basis": link.consent_basis,
                "risk_lives_alone": link.risk_lives_alone,
                "risk_wandering": link.risk_wandering,
                "approval_status": link.approval_status,
                "approved_by": link.approved_by.full_name if link.approved_by else None,
                "approved_at": link.approved_at,
                "rejection_reason": link.rejection_reason,
                "created_at": link.created_at
            }
            data.append(item)
        
        return Response(data)

class AdminActivateUserView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, user_id):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            
            # Only allow activation of verified users
            if user.status != 'verified':
                return Response(
                    {"error": "User must be in 'verified' status to activate"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.status = 'active'
            user.save()
            
            return Response({
                "message": f"User {user.full_name} activated successfully",
                "user": users_serializers.UserSerializer(user).data
            })
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class InquiryListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = users_serializers.InquirySerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Inquiry.objects.all().order_by('-created_at')
        return Inquiry.objects.filter(caregiver=user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(caregiver=self.request.user)

class InquiryDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = users_serializers.InquirySerializer
    queryset = Inquiry.objects.all()
    
    def perform_update(self, serializer):
        if self.request.user.role == 'admin':
            serializer.save()
        else:
            # Caregivers can't update status or admin_response
            serializer.save(caregiver=self.request.user)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = users_serializers.UserSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        # If caregiver profile data is provided, update it too
        if user.role == 'caregiver' and 'caregiver_profile' in self.request.data:
            cp_data = self.request.data.get('caregiver_profile')
            cp_serializer = users_serializers.CaregiverProfileSerializer(user.caregiver_profile, data=cp_data, partial=True)
            if cp_serializer.is_valid():
                cp_serializer.save()

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({"error": "Incorrect old password"}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({"error": "New password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            import uuid
            token = str(uuid.uuid4())
            from .models import PasswordResetToken
            PasswordResetToken.objects.create(user=user, token=token)
            
            # Prepare email content
            reset_link = f"http://localhost:5173/reset-password/{token}"
            subject = "Memoraid - Password Reset Link"
            message = f"Hello,\n\nYou requested a password reset for your Memoraid account. Please click the link below to reset your password:\n\n{reset_link}\n\nThis link is valid for 1 hour.\n\nBest regards,\nMemoraid Team"
            
            # Simulated email send (Dummy Integration)
            print(f"--- DUMMY EMAIL START ---")
            print(f"TO: {email}")
            print(f"SUBJECT: {subject}")
            print(f"MESSAGE: {message}")
            print(f"--- DUMMY EMAIL END ---")
            
            return Response({"message": "Password reset link has been simulated. Check backend console."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # We return 200 even if user doesn't exist for security (avoid email enumeration)
            return Response({"message": "If an account exists with this email, a reset link has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    # ... (existing code)
    pass

class FCMTokenRegisterView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = users_serializers.FCMTokenSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "FCM token registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Caregiver Workspace ViewSets ---

class IsPrimaryCaregiver(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Assumes obj has a patient attribute or is a patient profile
        patient = getattr(obj, 'patient', obj if hasattr(obj, 'patient_profile') else None)
        if not patient: return False
        try:
            link = PatientCaregiver.objects.filter(patient=patient, caregiver=request.user).first()
            return link is not None and link.is_approved and link.level == 'primary'
        except Exception:
            return False

class IsPrimaryCaregiverOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsPrimaryCaregiver().has_object_permission(request, view, obj)

class RoutineViewSet(viewsets.ModelViewSet):
    serializer_class = users_serializers.RoutineSerializer
    permission_classes = [permissions.IsAuthenticated, IsPrimaryCaregiverOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        date_param = self.request.query_params.get('date')
        
        # Base filter: not deleted
        queryset = Routine.objects.filter(is_deleted=False)
        
        if user.role == 'patient':
            queryset = queryset.filter(patient=user)
        else:
            patient_id = self.request.query_params.get('patient_id')
            linked_patient_ids = PatientCaregiver.objects.filter(caregiver=user, is_approved=True).values_list('patient_id', flat=True)
            
            if patient_id:
                try:
                    if int(patient_id) in linked_patient_ids:
                        queryset = queryset.filter(patient_id=patient_id)
                    else:
                        return Routine.objects.none()
                except ValueError:
                    return Routine.objects.none()
            else:
                queryset = queryset.filter(patient_id__in=linked_patient_ids)
        
        if date_param:
            try:
                target_date = datetime.datetime.strptime(date_param, '%Y-%m-%d').date()
                weekday = target_date.weekday()
                
                queryset = queryset.filter(
                    Q(frequency='daily') |
                    Q(frequency='custom') |
                    Q(frequency='weekly', days_of_week__contains=weekday) |
                    Q(frequency='once', target_date=target_date)
                )
            except ValueError:
                pass
                
        return queryset.order_by('time')

    def perform_create(self, serializer):
        # Ensure only primary caregiver can create routines for their linked patient
        patient_id = self.request.data.get('patient')
        if not PatientCaregiver.objects.filter(caregiver=self.request.user, patient_id=patient_id, is_approved=True, level='primary').exists():
            raise PermissionDenied("Only primary caregivers can create routines.")
        serializer.save()

    def perform_destroy(self, instance):
        # Ensure only primary caregiver can delete routines
        if not PatientCaregiver.objects.filter(caregiver=self.request.user, patient=instance.patient, is_approved=True, level='primary').exists():
            raise PermissionDenied("Only primary caregivers can delete routines.")
        
        # Soft delete
        instance.is_deleted = True
        instance.is_active = False
        instance.save()

        # Clean up any pending or missed logs for today and the future
        # (History for past days is preserved, and completed/escalated logs for today are preserved)
        from .models import TaskLog
        from django.utils import timezone
        today = timezone.now().date()
        TaskLog.objects.filter(
            routine=instance, 
            date__gte=today, 
            status__in=['pending', 'missed']
        ).delete()

class TaskLogViewSet(viewsets.ModelViewSet):
    serializer_class = users_serializers.TaskLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        date_param = self.request.query_params.get('date')
        
        # Trigger real-time escalation and alert checks when viewing today's tasks
        # This ensures the logic works even if Celery beat is not running
        # We use the client's date_param if provided, otherwise server today
        check_date_str = date_param if date_param else timezone.now().date().isoformat()
        try:
            check_date = datetime.datetime.strptime(check_date_str, '%Y-%m-%d').date()
            # Only trigger for reasonable dates (today or very recent)
            if abs((check_date - timezone.now().date()).days) <= 1:
                try:
                    # Ensure task instances exist for the requested date
                    generate_daily_task_instances(target_date=check_date)
                    # Run the escalation and reminder logic (these use server time internally)
                    process_escalations()
                    trigger_persistent_alerts()
                except Exception as e:
                    print(f"Background task trigger error: {e}")
        except ValueError:
            pass

        if user.role == 'patient':
            qs = TaskLog.objects.filter(routine__patient=user)
        else:
            patient_id = self.request.query_params.get('patient_id')
            linked_patient_ids = PatientCaregiver.objects.filter(caregiver=user, is_approved=True).values_list('patient_id', flat=True)
            
            if patient_id:
                try:
                    if int(patient_id) in linked_patient_ids:
                        qs = TaskLog.objects.filter(routine__patient_id=patient_id)
                    else:
                        return TaskLog.objects.none()
                except ValueError:
                    return TaskLog.objects.none()
            else:
                qs = TaskLog.objects.filter(routine__patient_id__in=linked_patient_ids)
        
        if date_param:
            qs = qs.filter(date=date_param)
            
        # Exclude logs for deleted routines that aren't already completed/escalated
        # (This prevents "ghost" tasks showing up in trackers after deletion)
        today = timezone.now().date()
        today_str = today.isoformat()
        if date_param:
            if date_param == today_str:
                # For today: keep ghost tasks (completed/escalated) for history
                qs = qs.exclude(routine__is_deleted=True, status__in=['pending', 'missed'])
            elif date_param > today_str:
                # For future: hide EVERYTHING related to deleted routines
                qs = qs.exclude(routine__is_deleted=True)
            # For past (date_param < today_str): show everything as historical record
        else:
            # Default (no date param, usually for stats): exclude pending/missed ghost tasks
            qs = qs.exclude(routine__is_deleted=True, status__in=['pending', 'missed'])
            
        return qs.order_by('-date', 'routine__time')

    def perform_create(self, serializer):
        routine_id = self.request.data.get('routine')
        if not routine_id:
             raise users_serializers.serializers.ValidationError({"routine": "This field is required."})
             
        try:
            routine = Routine.objects.get(id=routine_id)
            user = self.request.user
            
            # Allow if user is the patient themselves OR a primary caregiver
            is_patient = (user.role == 'patient' and routine.patient == user)
            is_primary_cg = PatientCaregiver.objects.filter(
                caregiver=user, 
                patient=routine.patient, 
                is_approved=True, 
                caregiver__caregiver_profile__level='primary'
            ).exists()
            
            if not (is_patient or is_primary_cg):
                 # Check if they are at least a linked caregiver (primary or secondary)
                 is_linked_cg = PatientCaregiver.objects.filter(
                     caregiver=user, 
                     patient=routine.patient, 
                     is_approved=True
                 ).exists()
                 
                 if not is_linked_cg:
                     raise PermissionDenied("You do not have permission to log this routine.")
                 
            serializer.save(handled_by=user)
        except Routine.DoesNotExist:
             raise users_serializers.serializers.ValidationError({"routine": "Invalid routine ID."})

    def perform_update(self, serializer):
        user = self.request.user
        obj = self.get_object()
        
        is_patient = (user.role == 'patient' and obj.routine.patient == user)
        # Check if they are a primary caregiver for THIS patient
        is_primary_cg = PatientCaregiver.objects.filter(
            caregiver=user, 
            patient=obj.routine.patient, 
            is_approved=True, 
            level='primary'
        ).exists()
        
        # Allow secondary caregivers to mark tasks as completed or undo them
        is_secondary_cg = (
            user.role == 'caregiver' and 
            PatientCaregiver.objects.filter(caregiver=user, patient=obj.routine.patient, is_approved=True, level='secondary').exists()
        )
        
        allowed_statuses = ['completed', 'pending', 'escalated']
        if is_patient or is_primary_cg or (is_secondary_cg and serializer.validated_data.get('status') in allowed_statuses):
            if serializer.validated_data.get('status') in ['completed', 'escalated']:
                serializer.save(handled_by=user, acknowledged_at=timezone.now())
            else:
                serializer.save(handled_by=user)
        else:
            raise PermissionDenied("Only patients or primary caregivers can update task status (secondary caregivers can only mark as completed, undo, or acknowledge).")

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = users_serializers.AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Alert.objects.filter(patient=user).order_by('-created_at')

        patient_id = self.request.query_params.get('patient_id')
        if user.role == 'admin':
            if patient_id:
                return Alert.objects.filter(patient_id=patient_id).order_by('-created_at')
            return Alert.objects.all().order_by('-created_at')

        if patient_id:
            if PatientCaregiver.objects.filter(caregiver=user, patient_id=patient_id, is_approved=True).exists():
                queryset = Alert.objects.filter(patient_id=patient_id).order_by('-created_at')
                return queryset
        
        # Dashboard overview: All alerts for all linked patients
        if not patient_id:
            linked_patient_ids = PatientCaregiver.objects.filter(caregiver=user, is_approved=True).values_list('patient_id', flat=True)
            return Alert.objects.filter(patient_id__in=linked_patient_ids).order_by('-created_at')
            
        return Alert.objects.none()

    def list(self, request, *args, **kwargs):
        # Trigger background tasks synchronously for admins or global views
        if request.user.role == 'admin' or not request.query_params.get('patient_id'):
            try:
                generate_daily_task_instances()
                trigger_persistent_alerts()
                process_escalations()
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error triggering tasks: {e}")

        patient_id = self.request.query_params.get('patient_id')
        response = super().list(request, *args, **kwargs)
        
        if patient_id:
            from django.utils import timezone
            from .models import Routine, TaskLog, User
            try:
                patient = User.objects.get(id=patient_id)
                today = timezone.now().date()
                
                # Check for active alerts (real ones)
                active_count = Alert.objects.filter(patient=patient, status='active').count()
                
                # Update any overdue pending logs to 'missed' if there is an active alert for them
                # This ensures consistent view across dashboard and execution
                if active_count > 0:
                    overdue_logs = TaskLog.objects.filter(
                        routine__patient=patient,
                        date=today,
                        status='pending',
                        scheduled_datetime__lte=timezone.localtime(timezone.now())
                    )
                    overdue_logs.update(status='missed')
                
                active_real_alerts = Alert.objects.filter(patient=patient, status='active')
                has_active_real = active_real_alerts.exists()
                # Also check if a missed_task alert was handled today to avoid duplicate virtual alerts
                has_handled_missed = Alert.objects.filter(patient=patient, type='missed_task', status='handled', created_at__date=today).exists()
                
                if not has_active_real and not has_handled_missed:
                    # Calculate missed tasks (same logic as dashboard)
                    all_routines = Routine.objects.filter(patient=patient, is_active=True)
                    completed_today_ids = TaskLog.objects.filter(
                        routine__patient=patient, 
                        date=today, 
                        status='completed'
                    ).values_list('routine_id', flat=True)
                    
                    current_time = timezone.localtime(timezone.now()).time()
                    overdue_routines = []
                    for r in all_routines.exclude(id__in=completed_today_ids):
                         # Same safety checks as dashboard
                         is_late_creation = False
                         if r.created_at.date() == today:
                             creation_time = timezone.localtime(r.created_at).time()
                             if r.time < creation_time:
                                 is_late_creation = True
                         
                         if not is_late_creation and r.time < current_time:
                             overdue_routines.append(r)
                    
                    if overdue_routines:
                        overdue_names = ", ".join([r.name for r in overdue_routines])
                        earliest_time = min([r.time for r in overdue_routines])
                        overdue_logs = TaskLog.objects.filter(routine__in=overdue_routines, date=today)
                        total_alerts = sum([l.alert_count for l in overdue_logs])
                        
                        virtual_alert = {
                            "id": f"virtual_{patient.id}",
                            "patient_name": patient.full_name,
                            "patient": patient.id,
                            "type": "missed_task",
                            "status": "active",
                            "message": f"Missed Routine: {overdue_names}. (Alerted {total_alerts} times since {earliest_time.strftime('%I:%M %p')})",
                            "created_at": timezone.now()
                        }
                        response.data.insert(0, virtual_alert)
            except User.DoesNotExist:
                pass
                
        return response

    def perform_create(self, serializer):
        # Allow patients to create 'sos' alerts
        if self.request.user.role == 'patient':
            alert = serializer.save(
                patient=self.request.user,
                type='sos',
                status='active',
                latitude=self.request.data.get('latitude'),
                longitude=self.request.data.get('longitude')
            )
            # Notify Caregivers immediately
            from .tasks import send_fcm_notification
            caregivers = PatientCaregiver.objects.filter(patient=self.request.user, is_approved=True)
            for link in caregivers:
                send_fcm_notification(
                    user=link.caregiver,
                    title="EMERGENCY: SOS TRIGGERED",
                    body=f"{self.request.user.full_name} needs immediate help!",
                    data={
                        'type': 'sos',
                        'patient_id': str(self.request.user.id),
                        'alert_id': str(alert.id)
                    }
                )

            # Also notify all Admins
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admins = User.objects.filter(role='admin')
            for admin in admins:
                send_fcm_notification(
                    user=admin,
                    title="EMERGENCY SOS (Admin)",
                    body=f"Patient {self.request.user.full_name} needs help!",
                    data={
                        'type': 'sos',
                        'patient_id': str(self.request.user.id),
                        'alert_id': str(alert.id)
                    }
                )
        else:
            # Caregivers/Admins might create alerts through other flows, 
            # but usually it's automated or by patient.
            serializer.save()

    def update(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if isinstance(pk, str) and pk.startswith('virtual_'):
            # This is a synthetic alert acknowledgment
            # Create a real handled alert record in DB so it doesn't reappear
            try:
                patient_id = int(pk.replace('virtual_', ''))
                
                # Fetch Patient
                try:
                    patient = User.objects.get(id=patient_id)
                except User.DoesNotExist:
                     return Response({"error": "Patient not found"}, status=404)

                # Server-side calculation of missed routines for accuracy
                from django.utils import timezone
                from .models import Routine, TaskLog
                today = timezone.now().date()
                current_time = timezone.localtime(timezone.now()).time()

                all_routines = Routine.objects.filter(patient=patient, is_active=True)
                completed_today_ids = TaskLog.objects.filter(
                    routine__patient=patient, 
                    date=today, 
                    status='completed'
                ).values_list('routine_id', flat=True)

                overdue_routines = []
                for r in all_routines.exclude(id__in=completed_today_ids):
                    is_late_creation = False
                    if r.created_at.date() == today:
                         creation_time = timezone.localtime(r.created_at).time()
                         if r.time < creation_time:
                             is_late_creation = True
                    
                    if not is_late_creation and r.time < current_time:
                        overdue_routines.append(r)
                
                # Create individual alert for each missed routine AND TaskLog entry
                created_alerts = []
                for routine in overdue_routines:
                    # Create alert
                    alert = Alert.objects.create(
                        patient=patient,
                        routine=routine,
                        type='missed_task',
                        status=request.data.get('status', 'handled'),
                        message=f"{routine.name} at {routine.time.strftime('%I:%M %p')}",
                        handled_by=request.user
                    )
                    created_alerts.append(alert)
                    
                    # Update TaskLog entry with 'escalated' status
                    # Using update_or_create ensures existing pending/missed logs are updated
                    TaskLog.objects.update_or_create(
                        routine=routine,
                        date=today,
                        defaults={
                            'status': 'escalated',
                            'handled_by': request.user,
                            'acknowledged_at': timezone.now()
                        }
                    )
                
                # Return the first alert or a summary
                if created_alerts:
                    serializer = self.get_serializer(created_alerts[0])
                    return Response(serializer.data)
                else:
                    # No overdue routines found, create a generic alert
                    alert = Alert.objects.create(
                        patient=patient,
                        type='missed_task',
                        status=request.data.get('status', 'handled'),
                        message="Caregiver acknowledged overdue task reminder",
                        handled_by=request.user
                    )
                    serializer = self.get_serializer(alert)
                    return Response(serializer.data)
            except (ValueError, TypeError):
                return Response({"error": "Invalid virtual ID"}, status=400)
        
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save(handled_by=self.request.user, status='handled')
        if instance.status == 'handled' and instance.type == 'missed_task' and instance.routine:
            from .models import TaskLog
            from django.utils import timezone
            # Use the date from the alert's creation time
            alert_date = instance.created_at.date()
            TaskLog.objects.filter(
                routine=instance.routine,
                date=alert_date,
                status__in=['pending', 'missed']
            ).update(
                status='escalated',
                handled_by=self.request.user,
                acknowledged_at=timezone.now()
            )

class PatientMemoryViewSet(viewsets.ModelViewSet):
    serializer_class = users_serializers.PatientMemorySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        from .models import PatientCaregiver
        
        if user.role == 'caregiver':
            # Get all patients this caregiver has access to
            patient_links = PatientCaregiver.objects.filter(
                caregiver=user,
                is_approved=True
            ).values_list('patient_id', flat=True)
            
            queryset = PatientMemory.objects.filter(patient_id__in=patient_links)
            
            # If patient_id is provided in query params, filter further
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                queryset = queryset.filter(patient_id=patient_id)
            return queryset
            
        elif user.role == 'patient':
            # Patients can only see their own memories
            return PatientMemory.objects.filter(patient=user)
            
        return PatientMemory.objects.none()

    def perform_create(self, serializer):
        patient_id = self.request.data.get('patient')
        if not patient_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"patient": "Patient ID is required."})
        
        from .models import PatientCaregiver
        link = PatientCaregiver.objects.filter(
            caregiver=self.request.user, 
            patient_id=patient_id, 
            is_approved=True
        ).first()

        if not link:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must have an approved care link to add memories.")

        # Allow both Primary and Secondary caregivers to upload memories
        # if link.level != 'primary': ... (Removed restriction)
        
        serializer.save()

    def perform_destroy(self, instance):
        # Ensure only primary caregivers can delete memories
        from .models import PatientCaregiver
        link = PatientCaregiver.objects.filter(
            caregiver=self.request.user, 
            patient_id=instance.patient_id, 
            is_approved=True
        ).first()

        if not link:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must have an approved care link to delete memories.")

        if link.level != 'primary':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only primary caregivers can manage the Memory Gallery.")
            
        instance.delete()

class ProfilePhotoUploadView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = users_serializers.UserSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        target_patient_id = self.request.data.get('target_patient_id')
        if target_patient_id and self.request.user.role == 'caregiver':
            # Verify primary caregiver access
            from .models import PatientCaregiver
            link = PatientCaregiver.objects.filter(
                caregiver=self.request.user, 
                patient_id=target_patient_id, 
                is_approved=True,
                caregiver__caregiver_profile__level='primary'
            ).first()
            if not link:
                raise PermissionDenied("Only primary caregivers can update patient photos.")
            return link.patient
        return self.request.user

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
            user.save()
            return Response(users_serializers.UserSerializer(user, context={'request': request}).data)
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

class CaregiverPatientDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = users_serializers.UserSerializer
    queryset = User.objects.filter(role='patient')
    lookup_field = 'id'

    def get_object(self):
        patient_id = self.kwargs.get('id')
        # Ensure caregiver is linked and approved for this patient
        if not PatientCaregiver.objects.filter(caregiver=self.request.user, patient_id=patient_id, is_approved=True).exists():
            raise PermissionDenied("You are not authorized to view this patient's full workspace.")
        return super().get_object()

class CaregiverDashboardStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'caregiver':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        links = PatientCaregiver.objects.filter(caregiver=request.user)
        patients_data = []
        today = timezone.now().date()
        
        recent_alerts_queryset = Alert.objects.filter(
            patient__caregiver_links__caregiver=request.user,
            status='active'
        ).order_by('-created_at')[:10] # Show more in dashboard
        
        recent_alerts = users_serializers.AlertSerializer(recent_alerts_queryset, many=True).data
        
        for link in links:
            patient = link.patient
            
            p_status = 'normal'
            active_alerts = 0
            pending_tasks = 0
            completed_tasks = 0
            missed_tasks = 0
            next_task = "Pending Approval"
            next_task_time = "--:--"
            next_task_id = None
            
            if not link.is_approved:
                p_status = 'pending'
            else:
                # Trigger background tasks to ensure stats are fresh
                try:
                    generate_daily_task_instances()
                    process_escalations()
                    trigger_persistent_alerts()
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Error triggering tasks in CaregiverStats: {e}")

                # Use current local time
                now_local = timezone.localtime(timezone.now())
                current_time = now_local.time()
                current_weekday = now_local.weekday()
                
                # Fetch all routines
                all_possible_routines = Routine.objects.filter(patient=patient, is_active=True)
                
                # Use current local time
                now_local = timezone.localtime(timezone.now())
                current_time = now_local.time()
                
                # Fetch all logs for today
                todays_logs = TaskLog.objects.filter(routine__patient=patient, date=today).select_related('routine')
                
                completed_tasks = todays_logs.filter(status='completed').count()
                escalated_tasks = todays_logs.filter(status='escalated').count()
                # A task is 'active' if it's still pending (whether overdue or upcoming)
                active_logs = todays_logs.filter(status='pending').order_by('scheduled_datetime')
                
                pending_tasks = 0
                missed_tasks = todays_logs.filter(status='missed').count()
                
                for log in active_logs:
                    # Use scheduled_datetime for accurate overdue vs pending check
                    if log.scheduled_datetime > now_local:
                        pending_tasks += 1
                    else:
                        missed_tasks += 1
                
                total_tasks = completed_tasks + escalated_tasks + pending_tasks + missed_tasks
                
                # Determine Next Task: Earliest pending log for today
                next_log = active_logs.first()
                is_tomorrow = False
                
                if not next_log:
                    # All done for today or none scheduled. Look for the next occurrence.
                    tomorrow = today + datetime.timedelta(days=1)
                    tomorrow_weekday = tomorrow.weekday()
                    
                    # Search specifically for tomorrow first
                    next_routine = Routine.objects.filter(
                        Q(patient=patient, is_active=True, is_deleted=False) &
                        (
                            Q(frequency='daily') |
                            Q(frequency='custom') |
                            Q(frequency='weekly', days_of_week__contains=tomorrow_weekday) |
                            Q(frequency='once', target_date=tomorrow)
                        )
                    ).order_by('time').first()

                    if next_routine:
                        is_tomorrow = True
                        next_task = next_routine.name
                        next_task_time = f"{next_routine.time.strftime('%I:%M %p')} (Tomorrow)"
                        next_task_id = next_routine.id
                    else:
                        # If nothing tomorrow, look for the absolute next one (more than 1 day away)
                        # Ensure we don't pick one-time tasks from the past or today (they should be in TaskLogs if relevant)
                        abs_next = Routine.objects.filter(
                            Q(patient=patient, is_active=True, is_deleted=False) &
                            (
                                Q(frequency__in=['daily', 'weekly', 'custom']) |
                                Q(frequency='once', target_date__gt=today)
                            )
                        ).order_by('time').first()
                        
                        if abs_next:
                            if abs_next.frequency == 'once' and abs_next.target_date:
                                next_task = abs_next.name
                                next_task_time = f"{abs_next.time.strftime('%I:%M %p')} ({abs_next.target_date.strftime('%b %d')})"
                                next_task_id = abs_next.id
                            else:
                                # For weekly/daily that aren't tomorrow, we just say 'All caught up' for the current dashboard focus
                                next_task = "No upcoming routines|No care routines are scheduled in the upcoming time for now."
                                next_task_time = "--:--"
                                next_task_id = None
                        else:
                            next_task = "No upcoming routines|No care routines are scheduled in the upcoming time for now."
                            next_task_time = "--:--"
                            next_task_id = None
                else:
                    next_task = next_log.routine.name
                    time_str = timezone.localtime(next_log.scheduled_datetime).strftime('%I:%M %p')
                    next_task_time = time_str
                    next_task_id = next_log.routine.id

                active_alerts = Alert.objects.filter(patient=patient, status='active').count()
                
                if active_alerts == 0 and missed_tasks > 0:
                    active_alerts = missed_tasks
                
                if active_alerts > 0:
                    p_status = 'alert'
                elif missed_tasks > 0:
                    p_status = 'attention'
                else:
                    p_status = 'normal'
            
            patients_data.append({
                "id": patient.id,
                "full_name": patient.full_name,
                "status": p_status,
                "active_alerts": active_alerts,
                "pending_tasks": pending_tasks,
                "completed_tasks": completed_tasks,
                "missed_tasks": missed_tasks,
                "escalated_tasks": escalated_tasks,
                "total_tasks": total_tasks, # New field for progress bar accuracy
                "next_task": next_task,
                "next_task_time": next_task_time,
                "next_task_id": next_task_id,
                "condition": patient.patient_profile.condition if hasattr(patient, 'patient_profile') else None,
                "stage": patient.patient_profile.stage if hasattr(patient, 'patient_profile') else None,
                "email": patient.email,
                "patient_id": patient.unique_id,
                "relationship": link.relationship,
                "care_basis": link.care_context,
                "consent_basis": link.consent_basis,
                "requested_at": link.created_at
            })

            # p_status is already set based on active_alerts and pending_tasks above
            
            # Sync overdue pending logs to 'missed' status in DB for consistency if needed
            # but we already calculate missed_tasks as (status='missed' + overdue)
            pass
            
        # Global is_primary flag: Check the caregiver's profile level, not patient-specific links
        # Secondary caregivers should never have primary privileges
        is_primary_caregiver = False
        if hasattr(request.user, 'caregiver_profile'):
            is_primary_caregiver = request.user.caregiver_profile.level == 'primary'
        
        return Response({
            "patients": patients_data,
            "recent_alerts": recent_alerts,
            "total_pending_today": sum(p['pending_tasks'] for p in patients_data),
            "total_active_alerts": sum(1 for p in patients_data if p['status'] == 'alert'),
            "is_primary": is_primary_caregiver
        })

class PatientLinkingView(generics.CreateAPIView):
    serializer_class = users_serializers.PatientLinkingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != 'caregiver':
            raise PermissionDenied("Only caregivers can initiate patient linking.")
        serializer.save()

class CareNetworkView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get('patient_id')
        user = request.user
        
        from .models import PatientCaregiver
        
        if user.role == 'patient':
            # If a patient is requesting, they are the patient
            patient = user
        elif user.role == 'caregiver':
            if not patient_id:
                return Response({"error": "patient_id required for caregivers"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Check if requesting caregiver is linked to this patient
            link = PatientCaregiver.objects.filter(caregiver=user, patient_id=patient_id, is_approved=True).first()
            if not link:
                return Response({"error": "Unauthorized or patient not linked"}, status=status.HTTP_403_FORBIDDEN)
            patient = link.patient
        else:
            return Response({"error": "Unauthorized role"}, status=status.HTTP_403_FORBIDDEN)
            
        print(f"DEBUG: Found patient {patient.email}")
        
        # Get all caregivers for this patient
        links = PatientCaregiver.objects.filter(patient=patient)
        print(f"DEBUG: Found {links.count()} links for this patient.")
        team = []
        for l in links:
            lvl = (l.level or 'Secondary').capitalize()
            team.append({
                "id": l.caregiver.id,
                "name": l.caregiver.full_name,
                "email": l.caregiver.email,
                "role": f"{lvl} Caregiver",
                "relationship": l.relationship or "Caregiver",
                "is_approved": l.is_approved
            })
            
        # Get emergency contacts from profile
        emergency_contacts = []
        consulting_doctors = []
        if hasattr(patient, 'patient_profile'):
            pp = patient.patient_profile
            if pp.emergency_contact_name:
                emergency_contacts.append({
                    "name": pp.emergency_contact_name,
                    "phone": pp.emergency_contact_phone,
                    "relation": pp.emergency_contact_relation or "Primary Emergency Contact"
                })
            if pp.consulting_doctor:
                consulting_doctors.append({
                    "name": pp.consulting_doctor,
                    "phone": pp.consulting_doctor_contact or "N/A",
                    "relation": "Consulting Physician",
                    "hospital": pp.consulting_doctor_hospital,
                    "notes": pp.consulting_doctor_notes
                })
                
        return Response({
            "team": team,
            "emergency_contacts": emergency_contacts,
            "consulting_doctors": consulting_doctors,
            "is_primary": link.level == 'primary' if 'link' in locals() and link else False
        })

class CareTeamManagementView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'caregiver':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        patient_id = request.data.get('patient_id')
        action = request.data.get('action') # 'invite' or 'remove_member'
        
        # Check if requesting user is Primary Caregiver for this patient
        from .models import PatientCaregiver
        link = PatientCaregiver.objects.filter(caregiver=request.user, patient_id=patient_id, is_approved=True).first()
        if not link or request.user.caregiver_profile.level != 'primary':
            return Response({"error": "Only Primary Caregivers can manage the care team"}, status=status.HTTP_403_FORBIDDEN)
            
        patient = link.patient
        
        if action == 'invite':
            email = request.data.get('email')
            relationship = request.data.get('relationship', 'Family Assistant')
            try:
                secondary = User.objects.get(email=email, role='caregiver')
                # Create link if not exists. Invitations default to Secondary and Pending.
                PatientCaregiver.objects.get_or_create(
                    patient=patient, 
                    caregiver=secondary, 
                    defaults={
                        'is_approved': False,
                        'level': 'secondary',
                        'relationship': relationship
                    }
                )
                return Response({"message": f"Invitation sent for {secondary.full_name}. Awaiting admin approval."})
            except User.DoesNotExist:
                return Response({"error": "User with this email not found. They must first create a caregiver account."}, status=status.HTTP_404_NOT_FOUND)
                
        elif action == 'remove_member':
            member_id = request.data.get('member_id')
            if int(member_id) == request.user.id:
                return Response({"error": "Cannot remove yourself as primary. Contact support to transfer ownership."}, status=status.HTTP_400_BAD_REQUEST)
            
            PatientCaregiver.objects.filter(patient=patient, caregiver_id=member_id).delete()
            return Response({"message": "Member removed from care team."})
            
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

class ActivityTimelineView(generics.GenericAPIView):
    """
    Unified activity timeline that merges TaskLogs and Alerts
    for a comprehensive view of patient care activities.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        patient_id = request.query_params.get('patient_id')
        filter_type = request.query_params.get('status', 'all')
        
        if not patient_id:
            return Response({"error": "patient_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify caregiver has access to this patient
        if request.user.role == 'caregiver':
            if not PatientCaregiver.objects.filter(caregiver=request.user, patient_id=patient_id, is_approved=True).exists():
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'patient':
            if request.user.id != int(patient_id):
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        timeline = []
        
        # Fetch TaskLogs
        if filter_type in ['all', 'completed', 'missed']:
            task_logs = TaskLog.objects.filter(routine__patient_id=patient_id)
            if filter_type == 'completed':
                task_logs = task_logs.filter(status='completed')
            elif filter_type == 'missed':
                task_logs = task_logs.filter(status__in=['missed', 'escalated'])
            
            for log in task_logs:
                timeline.append({
                    'id': f'task_{log.id}',
                    'type': 'task',
                    'status': log.status,
                    'routine_name': log.routine.name,
                    'timestamp': log.acknowledged_at or log.timestamp,
                    'date': log.date,
                    'handled_by_name': log.handled_by.full_name if log.handled_by else None,
                    'handled_by_role': log.handled_by.role if log.handled_by else None,
                    'notes': log.routine.notes
                })
        
        # Fetch Alerts
        if filter_type in ['all', 'alert']:
            alerts = Alert.objects.filter(patient_id=patient_id)
            for alert in alerts:
                timeline.append({
                    'id': f'alert_{alert.id}',
                    'type': 'alert',
                    'status': alert.type,  # 'sos' or 'missed_task'
                    'routine_name': alert.routine.name if alert.routine else (
                        'SOS Emergency' if alert.type == 'sos' else 'Care Alert'
                    ),
                    'timestamp': alert.created_at,
                    'date': alert.created_at.date(),
                    'handled_by_name': alert.handled_by.full_name if alert.handled_by else None,
                    'handled_by_role': alert.handled_by.role if alert.handled_by else None,
                    'message': alert.message,
                    'alert_status': alert.status
                })
        
        # Sort by timestamp descending
        timeline.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(timeline)
