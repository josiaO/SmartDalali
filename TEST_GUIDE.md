# SmartDalali Role-Based Testing Guide

## Overview
This guide provides comprehensive testing instructions for the SmartDalali application's role-based authentication and data visibility system.

## Test Environment Status

### ✅ Backend Verified
- **Status**: Running at `http://localhost:8000`
- **API Endpoints**: Available at `/api/v1/`
- **Role Detection**: Working correctly (admin, agent, user)
- **Data**: All test data created and verified

### ✅ Frontend Verified  
- **Status**: Running at `http://localhost:5173`
- **Role-Based Routing**: Configured
- **Debug Logging**: Enhanced in AuthContext

---

## Test Credentials

### Admin User
```
Username: admin_test
Email:    admin@test.com
Password: admin123
Role:     superuser
```

### Agent Users
```
Agent 1:
  Username: agent1_test
  Email:    agent1@test.com
  Password: agent123
  Agency:   Elite Realty
  Verified: Yes

Agent 2:
  Username: agent2_test
  Email:    agent2@test.com
  Password: agent123
  Agency:   Home Finders
  Verified: Yes

Agent 3:
  Username: agent3_test
  Email:    agent3@test.com
  Password: agent123
  Agency:   Property Plus
  Verified: No
```

### Regular Users
```
Buyer 1:
  Username: buyer1_test
  Email:    buyer1@test.com
  Password: user123
  Role:     user

Buyer 2:
  Username: buyer2_test
  Email:    buyer2@test.com
  Password: user123
  Role:     user

Seller 1:
  Username: seller1_test
  Email:    seller1@test.com
  Password: user123
  Role:     user
```

---

## Test Data

### Properties Created
- **Agent 1 Properties** (2):
  1. Modern Downtown Apartment - $250,000 (Apartment)
  2. Commercial Land Plot - $1,200,000 (Land)

- **Agent 2 Properties** (2):
  1. Beautiful Family House - $450,000 (House)
  2. Cozy Studio Apartment - $150,000 (Apartment)

- **Agent 3 Properties** (2):
  1. Luxury Villa - $850,000 (Villa)
  2. Office Space - $350,000 (Office)

**Total**: 6 properties, 7 published, 5 paid

---

## Testing Procedures

### Phase 1: Backend API Testing

#### Step 1: Test Admin Login
```bash
curl -X POST http://localhost:8000/api/v1/accounts/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

**Expected Response:**
```json
{
  "access": "<token>",
  "refresh": "<token>"
}
```

#### Step 2: Fetch Admin Profile
```bash
# Replace <ACCESS_TOKEN> with token from above
curl -X GET http://localhost:8000/api/v1/accounts/me/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected Response Contains:**
```json
{
  "username": "admin_test",
  "email": "admin@test.com",
  "role": "admin",
  "groups": [],
  "is_superuser": true
}
```

#### Step 3: Test Agent Login
```bash
curl -X POST http://localhost:8000/api/v1/accounts/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@test.com","password":"agent123"}'
```

**Expected Response:**
```json
{
  "access": "<token>",
  "refresh": "<token>"
}
```

#### Step 4: Fetch Agent Profile
```bash
# Replace <ACCESS_TOKEN> with agent's token
curl -X GET http://localhost:8000/api/v1/accounts/me/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected Response Contains:**
```json
{
  "username": "agent1_test",
  "email": "agent1@test.com",
  "role": "agent",
  "groups": ["agent"],
  "is_superuser": false,
  "profile": {
    "name": "John Agent",
    "phone_number": "+1-555-1000",
    "address": "1000 Main St, City"
  },
  "agent_profile": {
    "agency_name": "Elite Realty",
    "phone": "+1-555-2000",
    "verified": true,
    "subscription_active": true
  }
}
```

#### Step 5: Test Regular User Login
```bash
curl -X POST http://localhost:8000/api/v1/accounts/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@test.com","password":"user123"}'
```

**Expected Response:**
```json
{
  "access": "<token>",
  "refresh": "<token>"
}
```

#### Step 6: Fetch Regular User Profile
```bash
# Replace <ACCESS_TOKEN> with user's token
curl -X GET http://localhost:8000/api/v1/accounts/me/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected Response Contains:**
```json
{
  "username": "buyer1_test",
  "email": "buyer1_test",
  "role": "user",
  "groups": [],
  "is_superuser": false,
  "profile": {
    "name": "Alice Johnson",
    "phone_number": "+1-555-3000",
    "address": "2000 Oak Ave, City"
  },
  "agent_profile": null
}
```

---

### Phase 2: Frontend Testing

#### Step 1: Open Browser Developer Tools
1. Open Chrome/Firefox DevTools (F12)
2. Go to **Console** tab
3. Keep this open during testing

#### Step 2: Test Admin Login Flow

**Action**: 
1. Navigate to `http://localhost:5173`
2. Click "Login"
3. Enter:
   - Email: `admin@test.com`
   - Password: `admin123`
4. Click "Sign In"

**Expected in Console Output:**
```
Raw backend user data: {
  "role": "admin",
  "is_superuser": true,
  "groups": [],
  ...
}
data.role (from backend): admin
Using role from backend: admin
Final assigned role: admin
```

**Expected Navigation:**
- Redirect to: `/admin`
- Page displays: Admin Dashboard

#### Step 3: Test Agent Login Flow

**Action**:
1. Navigate to `http://localhost:5173`
2. Click "Login"
3. Enter:
   - Email: `agent1@test.com`
   - Password: `agent123`
4. Click "Sign In"

**Expected in Console Output:**
```
Raw backend user data: {
  "role": "agent",
  "groups": ["agent"],
  ...
}
data.groups: ["agent"]
data.role (from backend): agent
Using role from backend: agent
Final assigned role: agent
```

**Expected Navigation:**
- Redirect to: `/agent`
- Page displays: Agent Dashboard
- Shows agent's properties
- Shows agency information

**⚠️ If Redirected to `/dashboard` Instead:**
1. Check console for errors
2. Note the console output for debugging
3. Verify `Final assigned role: agent` is logged
4. If role is correct but redirect wrong, there's a routing issue

#### Step 4: Test Regular User Login Flow

**Action**:
1. Navigate to `http://localhost:5173`
2. Click "Login"
3. Enter:
   - Email: `buyer1@test.com`
   - Password: `user123`
4. Click "Sign In"

**Expected in Console Output:**
```
Raw backend user data: {
  "role": "user",
  "groups": [],
  ...
}
data.role (from backend): user
Using role from backend: user
Final assigned role: user
```

**Expected Navigation:**
- Redirect to: `/dashboard`
- Page displays: User Dashboard

---

### Phase 3: Data Visibility Testing

#### Test Agent Dashboard
1. Login as `agent1_test`
2. Verify the agent dashboard shows:
   - Agent profile information (name, agency)
   - Agency verified status
   - Subscription information
   - Agent's listings (2 properties)
   - Statistics for agent's properties

**Expected Properties Shown:**
- Modern Downtown Apartment
- Commercial Land Plot

#### Test User Dashboard
1. Login as `buyer1_test`
2. Verify the user dashboard shows:
   - User profile information
   - User's property listings (if any)
   - Available properties from all agents
   - Search and filter capabilities

---

## Debugging Checklist

### If Agent Is Redirected to User Dashboard

1. **Check Console Logs** (F12 → Console)
   ```
   ✓ Data received from backend?
   ✓ role field present in response?
   ✓ role value is "agent"?
   ✓ Final assigned role = "agent"?
   ✓ getDashboardRoute returned "/agent"?
   ✓ redirectByRole called navigate("/agent")?
   ```

2. **Verify Backend Response**
   - Use curl to fetch `/api/v1/accounts/me/` with agent token
   - Confirm `"role": "agent"` in response
   - Confirm `"groups": ["agent"]` in response

3. **Check Frontend Routing**
   - Open DevTools → Application → Local Storage
   - Verify `access_token` and `refresh_token` are stored
   - Check that tokens are being sent in request headers

4. **Check AuthContext State**
   - Add breakpoint in AuthContext.tsx near `redirectByRole`
   - Verify `user.role === "agent"` at that point

### Key Console Log Points

These logs will appear in order during login:

```
1. "AuthContext.login called with email: agent1@test.com"
2. "Cleared previous tokens from localStorage"
3. "Auth login tokens set: { access: ..., refresh: ... }"
4. "About to fetch profile with explicit header..."
5. "Profile fetch succeeded with token header set explicitly"
6. "Raw backend user data: ..." ← Check this for role
7. "data.role (from backend): agent" ← Should see "agent"
8. "Using role from backend: agent" ← Should be this line
9. "Final assigned role: agent" ← Final verification
```

---

## Testing Checklist

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:5173
- [ ] Admin user can login and access `/admin`
- [ ] Agent user can login and access `/agent`
- [ ] Regular user can login and access `/dashboard`
- [ ] Console logs show correct role detection
- [ ] Agent dashboard shows agent's properties only
- [ ] User dashboard shows available properties
- [ ] Profile information displays correctly
- [ ] Logout works for all roles

---

## Common Issues & Solutions

### Issue: "Login failed" or 401 Unauthorized
**Solution:**
- Verify credentials are correct
- Check backend is running
- Verify user exists in database
- Check password is correct (case-sensitive)

### Issue: Token errors
**Solution:**
- Clear browser local storage
- Clear browser cookies
- Try logging in again
- Check backend logs for JWT issues

### Issue: Profile data not showing
**Solution:**
- Verify profile exists in backend database
- Check profile serializer returns correct data
- Verify authorization header is sent correctly

### Issue: Wrong dashboard after login
**Solution:**
- Check browser console for role detection logs
- Verify backend API returns correct role
- Check routing configuration in App.tsx
- Clear cache and try again

---

## API Reference

### Login Endpoint
```
POST /api/v1/accounts/auth/token/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access": "JWT_TOKEN",
  "refresh": "JWT_TOKEN"
}
```

### Get Current User Profile
```
GET /api/v1/accounts/me/
Authorization: Bearer <ACCESS_TOKEN>

Response: UserSerializer data with role, groups, profile, agent_profile
```

### Get All Properties (filtered by user role)
```
GET /api/v1/properties/
Authorization: Bearer <ACCESS_TOKEN>

Response: List of property objects
```

---

## Notes

- All test data is persisted in the database
- You can create additional test data using the Django admin
- Changes to role logic should trigger rebuilds if using dev server
- Browser console is essential for debugging role detection
- API responses are cached by default (check ETag headers)

