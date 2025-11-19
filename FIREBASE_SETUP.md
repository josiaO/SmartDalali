# Firebase Authentication Setup Guide

This guide explains how to configure Firebase authentication for production and test the OAuth flows.

## Prerequisites

- Firebase project created: `real-estate-4b95b`
- Google OAuth and Facebook OAuth providers configured in Firebase Console
- Firebase service account JSON file from Firebase Console

## Backend Configuration

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `real-estate-4b95b`
3. Go to Project Settings (⚙️) → Service Accounts
4. Click "Generate New Private Key"
5. A JSON file will download - this contains your service account credentials

### 2. Configure Environment Variables

Add the following to `backend/.env`:

```env
# Firebase Admin SDK Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=real-estate-4b95b
FIREBASE_PRIVATE_KEY_ID=<your_key_id>
FIREBASE_PRIVATE_KEY=<your_private_key>
FIREBASE_CLIENT_EMAIL=<your_service_account_email>
FIREBASE_CLIENT_ID=<your_client_id>
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=<your_cert_url>
```

**Note:** For the `FIREBASE_PRIVATE_KEY`, if it contains newline characters, they should be represented as `\n` in the .env file (they will be automatically converted to actual newlines by the settings.py).

### 3. Restart Django Backend

```bash
source .venv/bin/activate
cd backend
python manage.py runserver
```

You should see:
- ✅ Firebase Admin SDK initialized successfully (no warning message)
- ✅ Backend available at http://localhost:8000

## Frontend Configuration

The frontend is already configured with production Firebase credentials:
- API Key: `AIzaSyBAAhLXXBNyMwXHtVXJDAZZvelV1lc0CBo`
- Auth Domain: `real-estate-4b95b.firebaseapp.com`
- OAuth Providers: Google and Facebook

No additional frontend setup is needed.

## Testing OAuth Flows

### Test 1: Google OAuth Login (Desktop)

1. Start both frontend and backend:
   ```bash
   # Terminal 1: Backend
   cd backend && source ../.venv/bin/activate && python manage.py runserver
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. Open frontend at http://localhost:5173

3. Navigate to the **Login** page

4. Click the **"Sign in with Google"** button

5. Expected flow:
   - Google popup window appears
   - User grants permissions
   - Popup closes automatically
   - User redirected to dashboard
   - Tokens stored in localStorage

6. Verify in browser console (F12):
   - `localStorage.access_token` should exist
   - `localStorage.refresh_token` should exist

### Test 2: Facebook OAuth Login (Desktop)

1. Click the **"Sign in with Facebook"** button on Login page

2. Expected flow:
   - Facebook popup appears
   - User grants permissions
   - User redirected to dashboard
   - Tokens stored in localStorage

3. Verify authentication:
   - Open DevTools → Network tab
   - Look for POST to `/api/accounts/firebase-login/`
   - Response should contain `access` and `refresh` tokens

### Test 3: Mobile Redirect Flow

1. Open Developer Tools (F12) → Toggle device toolbar (Ctrl+Shift+M)

2. Select a mobile device from the device list

3. Refresh page and navigate to Login

4. Click **"Sign in with Google"** or **"Sign in with Facebook"**

5. Expected flow:
   - **Redirect** instead of popup (full page navigation)
   - User completes authentication
   - Redirected back to dashboard automatically
   - Same token storage as desktop

### Test 4: User Profile Creation

After successful OAuth login:

1. Navigate to your profile/dashboard

2. Verify the following are populated:
   - ✅ User email matches Firebase email
   - ✅ User name matches Firebase display name
   - ✅ User role properly set (defaults to regular user)
   - ✅ Backend database has new/updated user

3. Check backend database:
   ```bash
   cd backend && source ../.venv/bin/activate
   python manage.py shell
   >>> from django.contrib.auth.models import User
   >>> User.objects.filter(email='your.email@gmail.com')
   >>> from accounts.models import Profile
   >>> Profile.objects.get(firebase_uid='...')  # Should exist
   ```

### Test 5: Token Expiration and Refresh

1. Log in with any OAuth provider

2. In browser console, note the current tokens:
   ```javascript
   console.log(localStorage.getItem('access_token'))
   ```

3. Make an API request to verify it works:
   ```javascript
   fetch('http://localhost:8000/api/accounts/me/', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
   }).then(r => r.json()).then(console.log)
   ```

4. Expected: Returns user profile data

5. Test token refresh (after access token expires, which is 24 hours):
   - API interceptor automatically refreshes using `refresh_token`
   - User stays logged in without re-authenticating

### Test 6: Multiple Provider Integration

1. Create user with Google OAuth:
   - Email: `test.user@gmail.com`
   - Name: Test User

2. Sign out (click Logout button)

3. Try to sign in with Facebook using **different account**:
   - Expected: Creates new user (different email)
   - Separate `firebase_uid` in database

4. Try to sign in with Google but use **same Gmail account**:
   - Expected: Logs in to existing user
   - Maintains same `firebase_uid`

## Troubleshooting

### Issue: "Firebase token verification failed"

**Symptoms:** 
- POST `/accounts/firebase-login/` returns 401
- Backend logs show: "Firebase token verification failed"

**Solutions:**
1. Verify Firebase service account credentials in `.env`
2. Check Firebase credentials haven't expired (regenerate if needed)
3. Verify `FIREBASE_PRIVATE_KEY` has correct newline format
4. Check backend can initialize Firebase Admin SDK (should not show warning on startup)

### Issue: "Invalid Firebase token"

**Symptoms:**
- Token verification passes but UID doesn't match
- 401 response: "Firebase token UID mismatch"

**Solutions:**
1. Verify frontend is sending correct `firebase_uid`
2. Check token wasn't modified in transit
3. Clear browser cache and try again

### Issue: User not created in database

**Symptoms:**
- OAuth login succeeds
- User profile shows correctly
- But database check shows no user

**Solutions:**
1. Check database migration was applied: `python manage.py migrate`
2. Verify email doesn't already exist with different provider
3. Check backend logs for transaction errors

### Issue: "Redirect result error" or "Firebase credential initialization failed"

**Symptoms:**
- Recurring error in browser console
- Mobile redirect flow doesn't work

**Solutions:**
1. Ensure Firebase credentials are loaded before app initializes
2. Check FIREBASE_PROJECT_ID in settings.py
3. Verify Firebase app is initialized only once

## API Endpoint Reference

### POST /api/accounts/firebase-login/

**Purpose:** Exchange Firebase token for Django JWT tokens

**Request:**
```json
{
  "firebase_token": "string (required)",
  "firebase_uid": "string (required)",
  "email": "string (required)",
  "display_name": "string (optional)"
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "test",
    "email": "test@gmail.com",
    "first_name": "Test User"
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid Firebase token"
}
```

**Response (400):**
```json
{
  "error": "firebase_token and firebase_uid are required"
}
```

## Database Schema Changes

### Profile Model

New field added:
```python
firebase_uid = models.CharField(max_length=255, blank=True, null=True, unique=True)
```

- Stores the unique Firebase UID
- Allows linking multiple login attempts to same Firebase user
- Useful for audit trails and analytics

## Security Considerations

1. **Private Key Storage**: Never commit `.env` file to version control
2. **Token Expiration**: 
   - Access tokens: 24 hours (configurable in Django settings)
   - Refresh tokens: 7 days (configurable in Django settings)
3. **HTTPS in Production**: Ensure all Firebase and API endpoints use HTTPS
4. **CORS**: Frontend origin must be in Firebase authorized domains
5. **Firebase Rules**: Ensure Firebase security rules are properly configured for production

## Next Steps

1. ✅ Configure Firebase service account credentials
2. ✅ Test all four OAuth flows (Google, Facebook, mobile redirect, desktop popup)
3. ✅ Verify user creation and profile data
4. ✅ Test token refresh behavior
5. Deploy to production with proper environment variables
6. Monitor Firebase authentication usage in Firebase Console
7. Set up analytics to track authentication events

## Production Checklist

- [ ] Firebase service account credentials configured in `.env`
- [ ] HTTPS enabled for all endpoints
- [ ] Frontend domain added to Firebase authorized domains
- [ ] Firebase security rules reviewed and updated
- [ ] Backup service account key stored securely
- [ ] Monitor authentication quota/usage
- [ ] Set up alerts for authentication failures
- [ ] Database backups configured
- [ ] Test full flow in production environment
