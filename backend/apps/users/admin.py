from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TwoFactorTempToken

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['user_id', 'email', 'name', 'role', 'is_staff', 'is_superuser', 'is_active', 'created_at']
    list_filter = ['role', 'is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['email', 'name', 'role']
    ordering = ['email']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'role', 'profile_picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['created_at', 'last_login']


@admin.register(TwoFactorTempToken)
class TwoFactorTempTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'expires_at']
    list_filter = ['created_at', 'expires_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['token', 'created_at']
    date_hierarchy = 'created_at'