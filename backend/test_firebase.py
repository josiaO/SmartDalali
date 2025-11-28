"""
Test script to verify Firebase Admin SDK initialization and functionality
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import firebase_admin
from firebase_admin import auth, credentials

def test_firebase_initialization():
    """Test if Firebase Admin SDK is initialized"""
    print("=" * 60)
    print("Firebase Admin SDK Verification")
    print("=" * 60)
    
    # Check if Firebase is initialized
    if not firebase_admin._apps:
        print("❌ FAILED: Firebase Admin SDK is not initialized")
        return False
    
    print("✅ SUCCESS: Firebase Admin SDK is initialized")
    
    # Get the default app
    try:
        app = firebase_admin.get_app()
        print(f"✅ App name: {app.name}")
        print(f"✅ Project ID: {app.project_id}")
    except Exception as e:
        print(f"❌ FAILED: Could not get Firebase app: {e}")
        return False
    
    return True

def test_firebase_auth():
    """Test Firebase Authentication functionality"""
    print("\n" + "=" * 60)
    print("Firebase Authentication Test")
    print("=" * 60)
    
    try:
        # Try to list users (limited to 1 to avoid loading too many)
        # This tests if we have proper authentication with Firebase
        page = auth.list_users(max_results=1)
        print(f"✅ SUCCESS: Can connect to Firebase Authentication")
        print(f"   Total users in first page: {len(page.users)}")
        return True
    except Exception as e:
        print(f"❌ FAILED: Cannot connect to Firebase Authentication")
        print(f"   Error: {e}")
        return False

def test_firebase_credentials():
    """Display Firebase configuration (without sensitive data)"""
    print("\n" + "=" * 60)
    print("Firebase Configuration")
    print("=" * 60)
    
    from django.conf import settings
    
    config = settings.FIREBASE_CONFIG
    print(f"✅ Project ID: {config.get('project_id', 'Not set')}")
    print(f"✅ Client Email: {config.get('client_email', 'Not set')}")
    print(f"✅ Private Key ID: {config.get('private_key_id', 'Not set')[:20]}...")
    
    private_key = config.get('private_key', '')
    if private_key:
        has_header = private_key.strip().startswith('-----BEGIN PRIVATE KEY-----')
        has_footer = private_key.strip().endswith('-----END PRIVATE KEY-----')
        has_newlines = '\n' in private_key
        
        print(f"✅ Private Key Format:")
        print(f"   - Has BEGIN header: {has_header}")
        print(f"   - Has END footer: {has_footer}")
        print(f"   - Contains newlines: {has_newlines}")
        print(f"   - Key length: {len(private_key)} characters")
    else:
        print("❌ Private Key: Not set")

if __name__ == "__main__":
    print("\n🔥 Starting Firebase Admin SDK Tests...\n")
    
    # Test 1: Initialization
    init_success = test_firebase_initialization()
    
    # Test 2: Credentials
    test_firebase_credentials()
    
    # Test 3: Authentication
    if init_success:
        auth_success = test_firebase_auth()
    else:
        auth_success = False
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Firebase Initialization: {'✅ PASS' if init_success else '❌ FAIL'}")
    print(f"Firebase Authentication: {'✅ PASS' if auth_success else '❌ FAIL'}")
    
    if init_success and auth_success:
        print("\n🎉 All Firebase tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some Firebase tests failed. Check the output above.")
        sys.exit(1)
