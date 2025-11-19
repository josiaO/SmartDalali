#!/usr/bin/env python3
"""
Test script to make login requests and inspect token responses.
Logs the actual token responses to help diagnose which user is being issued tokens.
"""
import requests
import json

BASE_URL = 'http://localhost:8000/api/v1'

test_cases = [
    {'email': 'johndoe@gmail.com', 'password': 'password'},
    {'email': 'josia.obeid@gmail.com', 'password': 'password'},
]

print('=== Token Endpoint Test ===\n')

for i, creds in enumerate(test_cases, 1):
    print(f'Test {i}: Login with {creds["email"]}')
    print('-' * 60)
    
    try:
        resp = requests.post(f'{BASE_URL}/accounts/auth/token/', json=creds, timeout=5)
        print(f'Status: {resp.status_code}')
        
        if resp.status_code == 200:
            data = resp.json()
            access_token = data.get('access', '')
            refresh_token = data.get('refresh', '')
            
            # Show token prefixes for debugging
            print(f'Access token prefix: {access_token[:20]}...')
            print(f'Refresh token prefix: {refresh_token[:20]}...')
            
            # Try to decode the access token (JWT)
            try:
                parts = access_token.split('.')
                if len(parts) == 3:
                    # Decode the payload (second part)
                    import base64
                    payload = parts[1]
                    # Add padding if needed
                    padding = 4 - len(payload) % 4
                    if padding != 4:
                        payload += '=' * padding
                    decoded = base64.urlsafe_b64decode(payload)
                    payload_obj = json.loads(decoded)
                    print(f'Token payload user_id: {payload_obj.get("user_id")}')
                    print(f'Token payload username: {payload_obj.get("username", "N/A")}')
            except Exception as e:
                print(f'Could not decode token: {e}')
            
            # Now fetch the profile with this token to see which user is returned
            print('\nFetching profile with this token...')
            headers = {'Authorization': f'Bearer {access_token}'}
            profile_resp = requests.get(f'{BASE_URL}/accounts/me/', headers=headers, timeout=5)
            if profile_resp.status_code == 200:
                profile = profile_resp.json()
                print(f'Profile returned: username={profile.get("username")}, email={profile.get("email")}, id={profile.get("id")}')
            else:
                print(f'Profile fetch failed: {profile_resp.status_code}')
        else:
            print(f'Response: {resp.text}')
    
    except Exception as e:
        print(f'Error: {e}')
    
    print()
