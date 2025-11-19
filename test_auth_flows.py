#!/usr/bin/env python3
"""
Comprehensive authentication flow testing script.
Tests user and agent signup/login flows and role-based redirects.
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, status):
    icon = "✓" if status else "✗"
    color = Colors.GREEN if status else Colors.RED
    print(f"{color}{icon} {name}{Colors.END}")

def print_section(name):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}{Colors.END}")

def test_user_signup():
    """Test normal user signup flow"""
    print_section("Testing User Signup Flow")
    
    try:
        # Generate unique credentials
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        email = f"testuser{unique_id}@example.com"
        username = f"testuser{unique_id}"
        password = "testpass123456"
        
        print(f"Signup details:")
        print(f"  Email: {email}")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        
        # Register
        response = requests.post(
            f"{API_BASE}/accounts/auth/register/",
            json={
                "email": email,
                "username": username,
                "password": password,
                "is_agent": False
            }
        )
        
        status = response.status_code in [200, 201]
        print_test("User Registration", status)
        
        if not status:
            print(f"  Error: {response.text}")
            return None, None
        
        # Login
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/token/",
            json={
                "email": email,
                "password": password
            }
        )
        
        status = response.status_code == 200
        print_test("User Login", status)
        
        if not status:
            print(f"  Error: {response.text}")
            return None, None
        
        data = response.json()
        access_token = data.get('access')
        
        # Fetch profile
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/accounts/me/", headers=headers)
        
        status = response.status_code == 200
        print_test("Fetch User Profile", status)
        
        if status:
            user_data = response.json()
            print(f"  User ID: {user_data.get('id')}")
            print(f"  Username: {user_data.get('username')}")
            print(f"  Email: {user_data.get('email')}")
            print(f"  Role: {user_data.get('role')}")
            print(f"  Is Agent: {user_data.get('is_agent')}")
            
            # Verify it's a normal user
            is_user = user_data.get('role') == 'user' and not user_data.get('is_agent')
            print_test("User Role Verified (should redirect to /dashboard)", is_user)
            
            return access_token, user_data
        else:
            print(f"  Error: {response.text}")
            return access_token, None
            
    except Exception as e:
        print_test(f"User Signup Flow", False)
        print(f"  Exception: {e}")
        return None, None

def test_agent_signup():
    """Test agent signup flow"""
    print_section("Testing Agent Signup Flow")
    
    try:
        # Generate unique credentials
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        email = f"testagent{unique_id}@example.com"
        username = f"testagent{unique_id}"
        password = "testpass123456"
        
        print(f"Signup details:")
        print(f"  Email: {email}")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        
        # Register as agent
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/register/",
            json={
                "email": email,
                "username": username,
                "password": password,
                "is_agent": True
            }
        )
        
        status = response.status_code in [200, 201]
        print_test("Agent Registration", status)
        
        if not status:
            print(f"  Error: {response.text}")
            return None, None
        
        # Login
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/token/",
            json={
                "email": email,
                "password": password
            }
        )
        
        status = response.status_code == 200
        print_test("Agent Login", status)
        
        if not status:
            print(f"  Error: {response.text}")
            return None, None
        
        data = response.json()
        access_token = data.get('access')
        
        # Fetch profile
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/accounts/me/", headers=headers)
        
        status = response.status_code == 200
        print_test("Fetch Agent Profile", status)
        
        if status:
            user_data = response.json()
            print(f"  User ID: {user_data.get('id')}")
            print(f"  Username: {user_data.get('username')}")
            print(f"  Email: {user_data.get('email')}")
            print(f"  Role: {user_data.get('role')}")
            print(f"  Is Agent: {user_data.get('is_agent')}")
            
            # Verify it's an agent
            is_agent = user_data.get('is_agent') == True
            print_test("Agent Role Verified (should redirect to /agent)", is_agent)
            
            return access_token, user_data
        else:
            print(f"  Error: {response.text}")
            return access_token, None
            
    except Exception as e:
        print_test(f"Agent Signup Flow", False)
        print(f"  Exception: {e}")
        return None, None

def test_user_login():
    """Test normal user login (use johndoe if available)"""
    print_section("Testing User Login Flow")
    
    try:
        email = "johndoe@gmail.com"
        password = "testpass123"
        
        print(f"Login details:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        
        # Login
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/token/",
            json={
                "email": email,
                "password": password
            }
        )
        
        status = response.status_code == 200
        print_test("User Login with johndoe@gmail.com", status)
        
        if not status:
            print(f"  Status: {response.status_code}")
            print(f"  Error: {response.text}")
            return None, None
        
        data = response.json()
        access_token = data.get('access')
        user_id = data.get('user_id') if isinstance(data, dict) else None
        
        print(f"  Token received: {access_token[:20]}...")
        
        # Fetch profile
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/accounts/me/", headers=headers)
        
        status = response.status_code == 200
        print_test("Fetch User Profile", status)
        
        if status:
            user_data = response.json()
            print(f"  User ID: {user_data.get('id')}")
            print(f"  Username: {user_data.get('username')}")
            print(f"  Email: {user_data.get('email')}")
            print(f"  Role: {user_data.get('role')}")
            print(f"  Is Agent: {user_data.get('is_agent')}")
            print(f"  Is Superuser: {user_data.get('is_superuser')}")
            
            # Verify it's johndoe (not superuser)
            correct_user = user_data.get('email') == 'johndoe@gmail.com'
            not_superuser = user_data.get('is_superuser') == False
            is_user = user_data.get('role') == 'user' and not user_data.get('is_agent')
            
            print_test("Correct User Retrieved (johndoe)", correct_user and not_superuser)
            print_test("User Role Verified (should redirect to /dashboard)", is_user)
            
            return access_token, user_data
        else:
            print(f"  Error: {response.text}")
            return access_token, None
            
    except Exception as e:
        print_test(f"User Login Flow", False)
        print(f"  Exception: {e}")
        return None, None

def test_token_refresh():
    """Test token refresh mechanism"""
    print_section("Testing Token Refresh")
    
    try:
        # First get tokens
        email = "johndoe@gmail.com"
        password = "testpass123"
        
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/token/",
            json={
                "email": email,
                "password": password
            }
        )
        
        if response.status_code != 200:
            print_test("Get Initial Tokens", False)
            return
        
        data = response.json()
        refresh_token = data.get('refresh')
        
        print_test("Get Initial Tokens", True)
        print(f"  Refresh Token: {refresh_token[:20]}...")
        
        # Try to refresh
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/token/refresh/",
            json={"refresh": refresh_token}
        )
        
        status = response.status_code == 200
        print_test("Token Refresh", status)
        
        if status:
            data = response.json()
            new_access = data.get('access')
            print(f"  New Access Token: {new_access[:20]}...")
        
    except Exception as e:
        print_test("Token Refresh Test", False)
        print(f"  Exception: {e}")

def test_logout():
    """Test logout endpoint"""
    print_section("Testing Logout")
    
    try:
        # First login
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/token/",
            json={
                "email": "johndoe@gmail.com",
                "password": "testpass123"
            }
        )
        
        if response.status_code != 200:
            print_test("Get Token for Logout Test", False)
            return
        
        access_token = response.json().get('access')
        print_test("Get Token for Logout Test", True)
        
        # Logout
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.post(
            f"{BASE_URL}/api/accounts/auth/logout/",
            headers=headers,
            json={}
        )
        
        status = response.status_code in [200, 205]  # 205 Reset Content is acceptable
        print_test("Logout Endpoint", status)
        print(f"  Status Code: {response.status_code}")
        
    except Exception as e:
        print_test("Logout Test", False)
        print(f"  Exception: {e}")

def test_cors():
    """Test CORS configuration"""
    print_section("Testing CORS Configuration")
    
    try:
        # Check CORS headers
        response = requests.get(
            f"{BASE_URL}/api/accounts/me/",
            headers={"Origin": "http://localhost:8081"}
        )
        
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        status = cors_origin is not None
        print_test("CORS Headers Present", status)
        
        if status:
            print(f"  Access-Control-Allow-Origin: {cors_origin}")
        
    except Exception as e:
        print_test("CORS Test", False)
        print(f"  Exception: {e}")

def main():
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  SmartDalali Authentication Flow Test")
    print(f"{'='*60}{Colors.END}\n")
    
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}\n")
    
    # Test CORS first
    test_cors()
    
    # Test token refresh
    test_token_refresh()
    
    # Test logout
    test_logout()
    
    # Test user flows
    user_token, user_data = test_user_login()
    
    # Test new user signup
    test_user_signup()
    
    # Test agent signup
    test_agent_signup()
    
    print_section("Test Summary")
    print(f"{Colors.GREEN}All critical authentication flows tested!{Colors.END}\n")

if __name__ == "__main__":
    main()
