#!/usr/bin/env python3
"""
Script to check for email/username mismatches in the database
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Check for the specific user
email_to_check = 'josia.obeid@gmail.com'

print(f"Searching for users with email: {email_to_check}")
print("=" * 60)

users = User.objects.filter(email__iexact=email_to_check)
if users.exists():
    for user in users:
        print(f"Found user:")
        print(f"  ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  First Name: {user.first_name}")
        print(f"  Last Name: {user.last_name}")
        print(f"  Is Active: {user.is_active}")
        print(f"  Is Superuser: {user.is_superuser}")
        print(f"  Groups: {list(user.groups.values_list('name', flat=True))}")
        print()
else:
    print(f"No user found with email: {email_to_check}")

# Check for similar usernames
print("\nSearching for users with similar usernames...")
print("=" * 60)
similar_users = User.objects.filter(username__icontains='josia')
for user in similar_users:
    print(f"Username: {user.username}, Email: {user.email}, ID: {user.id}")

# Check for duplicate emails
print("\nChecking for duplicate emails...")
print("=" * 60)
from django.db.models import Count
duplicates = User.objects.values('email').annotate(count=Count('email')).filter(count__gt=1)
if duplicates:
    for dup in duplicates:
        print(f"Email '{dup['email']}' has {dup['count']} accounts")
        users_with_email = User.objects.filter(email=dup['email'])
        for u in users_with_email:
            print(f"  - Username: {u.username}, ID: {u.id}")
else:
    print("No duplicate emails found")
