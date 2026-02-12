from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, VerifyOTPView, LoginView, OnboardingView, UserProfileView, 
    PasswordResetRequestView, PasswordResetConfirmView,
    AdminStatsView, AdminUserListView, AdminUserStatusView,
    AdminPendingApprovalsView, AdminApproveLinkView, AdminApprovalHistoryView, AdminActivateUserView,
    InquiryListView, InquiryDetailView,
    CaregiverDashboardStatsView, RoutineViewSet, TaskLogViewSet, AlertViewSet,
    CareNetworkView, CareTeamManagementView,
    CaregiverPatientDetailView, ProfilePhotoUploadView,
    PatientLinkingView, ChangePasswordView, PatientMemoryViewSet,
    CancelPatientLinkView,
    FCMTokenRegisterView, ActivityTimelineView, PingView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'caregiver/routines', RoutineViewSet, basename='routine')
router.register(r'caregiver/logs', TaskLogViewSet, basename='tasklog')
router.register(r'caregiver/alerts', AlertViewSet, basename='alert')
router.register(r'caregiver/memories', PatientMemoryViewSet, basename='patientmemory')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('otp/verify/', VerifyOTPView.as_view(), name='verify_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('onboarding/', OnboardingView.as_view(), name='onboarding'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Admin Endpoints
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:pk>/status/', AdminUserStatusView.as_view(), name='admin_user_status'),
    path('admin/approvals/', AdminPendingApprovalsView.as_view(), name='admin_approvals'),
    path('admin/approvals/<int:pk>/', AdminApproveLinkView.as_view(), name='admin_approve_link'),
    path('admin/approval-history/', AdminApprovalHistoryView.as_view(), name='admin_approval_history'),
    path('admin/users/<int:user_id>/activate/', AdminActivateUserView.as_view(), name='admin_activate_user'),
    path('inquiries/', InquiryListView.as_view(), name='inquiry_list'),
    path('inquiries/<int:pk>/', InquiryDetailView.as_view(), name='inquiry_detail'),
    
    # Caregiver Workspace
    path('caregiver/stats/', CaregiverDashboardStatsView.as_view(), name='caregiver_stats'),
    path('caregiver/link-patient/', PatientLinkingView.as_view(), name='link_patient'),
    path('caregiver/link-patient/<int:pk>/cancel/', CancelPatientLinkView.as_view(), name='cancel_link_patient'),
    path('caregiver/network/', CareNetworkView.as_view(), name='care_network'),
    path('caregiver/network/manage/', CareTeamManagementView.as_view(), name='manage_care_network'),
    path('caregiver/patient/<int:id>/', CaregiverPatientDetailView.as_view(), name='caregiver_patient_detail'),
    path('caregiver/activity/', ActivityTimelineView.as_view(), name='activity_timeline'),
    path('profile/photo/', ProfilePhotoUploadView.as_view(), name='profile_photo_upload'),
    path('fcm-token/', FCMTokenRegisterView.as_view(), name='fcm_token_register'),
    path('ping/', PingView.as_view(), name='ping'),
]


