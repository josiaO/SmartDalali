#!/home/josiamosses/SmartDalali/.venv/bin/python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Set passwords for test users
for username in ['johndoe', 'josiamosses']:
    try:
        user = User.objects.get(username=username)
        user.set_password('password')
        user.save()
        print(f'✓ Password set for {username}')
    except User.DoesNotExist:
        print(f'✗ User {username} not found')
