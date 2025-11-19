from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Profile
from properties.models import AgentProfile as PropertiesAgentProfile

class AgentProfileInline(admin.StackedInline):
    # continue to inline the real AgentProfile on the User edit page
    model = PropertiesAgentProfile
    can_delete = False
    verbose_name_plural = 'Agent Profiles'
    fk_name = 'user'

class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'name', 'address']
    search_fields = ['user__username', 'phone_number', 'name']

class UserAdmin(BaseUserAdmin):
    inlines = [AgentProfileInline]
    list_display = ('username', 'email', 'is_staff', 'is_superuser', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'email')

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
