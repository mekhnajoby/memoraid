from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CaregiverProfile, PatientProfile, PatientCaregiver

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'role', 'status', 'is_staff')
    list_filter = ('role', 'status', 'is_staff', 'is_superuser')
    search_fields = ('email', 'full_name')
    ordering = ('email',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Status', {'fields': ('role', 'status')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Status', {'fields': ('full_name', 'role', 'status')}),
    )

@admin.register(CaregiverProfile)
class CaregiverProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'relationship', 'level', 'phone_number', 'city')

@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'condition', 'stage', 'primary_caregiver_email')

@admin.register(PatientCaregiver)
class PatientCaregiverAdmin(admin.ModelAdmin):
    list_display = ('patient', 'caregiver', 'is_approved', 'created_at')
    list_filter = ('is_approved',)
    actions = ['approve_links']

    def approve_links(self, request, queryset):
        for link in queryset:
            link.is_approved = True
            link.save() # This triggers the auto-activation logic in models.py
        self.message_user(request, f"Selected links have been approved and users activated.")
    approve_links.short_description = "Approve selected patient-caregiver links"

admin.site.register(User, UserAdmin)
