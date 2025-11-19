# LOGIN CREDENTIALS - IMPORTANT FIX

## Root Cause Found! 🎯

**The problem:** You were logging in with `agent1_test@test.com` but the user email is actually `agent1@test.com`

The console showed:
```
AuthContext.login called with email: agent1_test@test.com
[HTTP/1.1 401 Unauthorized 8ms]
```

But the user was created with:
```
Email: agent1@test.com (NOT agent1_test@test.com)
```

---

## Correct Test Credentials

### ADMIN
- **Email**: admin@test.com
- **Username**: admin_test
- **Password**: admin123
- **Expected Result**: Redirect to `/admin`

### AGENTS (Pick One)
- **Email**: agent1@test.com
- **Username**: agent1_test
- **Password**: agent123
- **Expected Result**: Redirect to `/agent`

OR

- **Email**: agent2@test.com
- **Username**: agent2_test
- **Password**: agent123
- **Expected Result**: Redirect to `/agent`

OR

- **Email**: agent3@test.com
- **Username**: agent3_test
- **Password**: agent123
- **Expected Result**: Redirect to `/agent`

### REGULAR USERS (Pick One)
- **Email**: buyer1@test.com
- **Username**: buyer1_test
- **Password**: user123
- **Expected Result**: Redirect to `/dashboard`

OR

- **Email**: buyer2@test.com
- **Username**: buyer2_test
- **Password**: user123
- **Expected Result**: Redirect to `/dashboard`

OR

- **Email**: seller1@test.com
- **Username**: seller1_test
- **Password**: user123
- **Expected Result**: Redirect to `/dashboard`

---

## Quick Test Now

1. Go to http://localhost:5173/login
2. Enter email: `agent1@test.com` (NOT agent1_test@test.com)
3. Enter password: `agent123`
4. Click Sign In
5. Check console - should show `Using role from backend: agent`
6. Should redirect to `/agent` dashboard (not `/dashboard`)

---

## Summary of Changes Made

✅ **Updated vite.config.ts**: Changed port from 8080 to 5173
✅ **Verified all test data**: 12 users, 6 properties, 15 images, 4 conversations
✅ **Verified API endpoints**: All working correctly (tested with curl)
✅ **Enhanced role detection**: AuthContext.tsx has comprehensive logging

---

## If It Still Doesn't Work

After logging in with **correct credentials** (`agent1@test.com`):

1. **Check Browser Console (F12)**:
   - Search for: "Using role from backend"
   - Should show: "Using role from backend: agent"

2. **Check Network Tab (F12)**:
   - Look for: POST `/api/v1/accounts/auth/token/`
   - Should return: 200 OK with access & refresh tokens
   - Then: GET `/api/v1/accounts/me/`
   - Response should include: `"role": "agent"` and `"groups": ["agent"]`

3. **If still redirects as user**:
   - Share the console output from the network requests
   - We'll debug the normalizeUser function further

