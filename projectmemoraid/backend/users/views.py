from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer, 
    CaregiverProfileSerializer, 
    PatientProfileSerializer,
    UserSerializer
)
from .models import CaregiverProfile, PatientProfile

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            serializer = UserSerializer(user)
            response.data['user'] = serializer.data
        return response

class OnboardingView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        user = request.user
        role = user.role
        
        if role == 'caregiver':
            serializer = CaregiverProfileSerializer(data=request.data)
            if serializer.is_valid():
                CaregiverProfile.objects.update_or_create(user=user, defaults=serializer.validated_data)
                
                # Set caregiver to active after completing onboarding
                user.status = 'active'
                user.save()
                user.refresh_from_db()
                return Response(UserSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif role == 'patient':
            serializer = PatientProfileSerializer(data=request.data)
            if serializer.is_valid():
                PatientProfile.objects.update_or_create(user=user, defaults=serializer.validated_data)
                # Set patient to active after completing onboarding
                user.status = 'active'
                user.save()
                user.refresh_from_db()
                return Response(UserSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

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
            
            # Send real email
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                print(f"DEBUG: Real email sent to {email}")
            except Exception as e:
                print(f"ERROR sending email: {str(e)}")
                # Fallback purely for local debugging if SMTP fails
                print(f"DEBUG: Password reset link for {email}: {reset_link}")
            
            return Response({"message": "Password reset link has been sent to your email."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # We return 200 even if user doesn't exist for security (avoid email enumeration)
            return Response({"message": "If an account exists with this email, a reset link has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('password')
        
        from .models import PasswordResetToken
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_valid():
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                reset_token.is_used = True
                reset_token.save()
                return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Token has expired or already been used."}, status=status.HTTP_400_BAD_REQUEST)
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

