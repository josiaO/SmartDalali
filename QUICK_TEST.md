# Quick Start Testing Guide

## Prerequisites

✅ **All Systems Running:**
- Backend running at `http://localhost:8000/api/v1/`
- Frontend running at `http://localhost:5173`
- Test data created (users, properties)

---

## 🚀 Quick Test: Agent Login Redirect Issue

### Step 1: Open Browser
Navigate to: `http://localhost:5173`

### Step 2: Open Developer Tools
Press `F12` → Go to **Console** tab

### Step 3: Perform Login
1. Click "Login" button
2. Enter credentials:
   ```
   Email: agent1@test.com
   Password: agent123
   ```
3. Click "Sign In"

### Step 4: Watch Console Output
You should see logs like this:

```
AuthContext.login called with email: agent1@test.com
Cleared previous tokens from localStorage
Auth login tokens set: { access: ..., refresh: ... }
About to fetch profile with explicit header...
Profile fetch succeeded with token header set explicitly
Raw backend user data: {
  "id": 7,
  "username": "agent1_test",
  "email": "agent1@test.com",
  "role": "agent",                     ← KEY LINE: Should be "agent"
  "groups": ["agent"],                 ← Should be ["agent"]
  ...
}
data.groups: ["agent"]
typeof data.groups: object
Array.isArray(data.groups): true
groupsArray: ["agent"]
groupsArray.includes("agent"): true
data.role (from backend): agent
Using role from backend: agent         ← KEY LINE: Should see this
Final assigned role: agent             ← KEY LINE: Should be "agent"
```

### Step 5: Check Redirect Destination
After login completes:
- ✅ **Expected**: Page shows "Agent Dashboard" at URL `http://localhost:5173/agent`
- ❌ **Issue**: Page shows "User Dashboard" at URL `http://localhost:5173/dashboard`

### Step 6: If Issue Occurs
**Capture the console output and check these things:**

1. **Verify role is detected:**
   - Look for: `Final assigned role: agent`
   - If showing `Final assigned role: user` → Role detection is failing

2. **Verify backend response:**
   - Look for: `data.role (from backend): agent`
   - If not showing → Backend didn't send role field

3. **Verify groups are received:**
   - Look for: `groupsArray.includes("agent"): true`
   - If showing false → Groups array not received correctly

---

## 🧪 Complete Test Sequence

### Test 1: Admin Login

**Credentials:**
```
Email: admin@test.com
Password: admin123
```

**Expected Result:**
- Console shows: `Final assigned role: admin`
- Redirects to: `http://localhost:5173/admin`
- Page displays: Admin Dashboard

---

### Test 2: Agent Login

**Credentials:**
```
Email: agent1@test.com
Password: agent123
```

**Expected Result:**
- Console shows: `Final assigned role: agent`
- Redirects to: `http://localhost:5173/agent`
- Page displays: Agent Dashboard with:
  - Agent name: "John Agent"
  - Agency: "Elite Realty"
  - Verified: Yes
  - Properties: 2 (Modern Downtown Apartment, Commercial Land Plot)

**If Redirected to /dashboard Instead:**
- This is the issue being diagnosed
- Console logs will show why

---

### Test 3: Regular User Login

**Credentials:**
```
Email: buyer1_test@test.com
Password: user123
```

**Expected Result:**
- Console shows: `Final assigned role: user`
- Redirects to: `http://localhost:5173/dashboard`
- Page displays: User Dashboard with available properties

---

## 🔍 API Endpoint Testing (No Frontend)

If you want to test just the API without the frontend:

### Get Agent Token
```bash
curl -X POST http://localhost:8000/api/v1/accounts/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@test.com","password":"agent123"}'
```

**Response:**
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
```

### Use Token to Get Profile
```bash
# Copy the "access" token from above response
curl -X GET http://localhost:8000/api/v1/accounts/me/ \
  -H "Authorization: Bearer eyJhbGci..."
```

**Expected Response Contains:**
```json
{
  "role": "agent",
  "groups": ["agent"],
  "username": "agent1_test",
  "email": "agent1@test.com",
  "agent_profile": {
    "agency_name": "Elite Realty",
    "verified": true
  }
}
```

If you see this in the API response, the backend is definitely working and the issue is only in the frontend.

---

## 📊 Data Validation

### Check Agent Properties Created
```bash
curl -X GET http://localhost:8000/api/v1/properties/ \
  -H "Authorization: Bearer <AGENT_TOKEN>"
```

Should return agent's properties

---

## 🆘 Troubleshooting

### Problem: "Login failed"
**Solution:**
- Check backend is running: `curl http://localhost:8000/api/v1/accounts/auth/token/` should return error (not connection refused)
- Verify email/password are correct
- Check backend logs for errors

### Problem: Token errors in console
**Solution:**
- Clear browser local storage (DevTools → Application → Clear Storage)
- Clear browser cookies
- Try login again

### Problem: Can't see console logs
**Solution:**
- Press F12 to open DevTools
- Click "Console" tab at top
- Refresh page (Ctrl+R or Cmd+R)
- Try login again
- Watch console as it appears

### Problem: Role detected correctly but wrong redirect
**Solution:**
- Check browser URL after redirect
- Check if routing in App.tsx has `/agent` route
- Verify getDashboardRoute() is working correctly

---

## 📝 Test Checklist

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:5173  
- [ ] Can access login page
- [ ] DevTools console is open
- [ ] Admin login works and shows admin dashboard
- [ ] Agent login shows correct console logs
- [ ] Agent redirects to `/agent` (or captures redirect issue)
- [ ] User login works and shows user dashboard
- [ ] Logout works for all roles

---

## 🔗 Quick Links

- **Frontend**: http://localhost:5173
- **Backend Admin**: http://localhost:8000/admin
- **API Base**: http://localhost:8000/api/v1/
- **Test Data**: See TESTING_STATUS.md
- **Full Guide**: See TEST_GUIDE.md

---

## 💡 Key Things to Remember

1. **Check Console**: F12 → Console is your best debugging tool
2. **Watch Logs**: The enhanced normalizeUser function logs everything
3. **API Works**: Backend has been verified to return correct role field
4. **Frontend Ready**: Frontend has been enhanced with robust role detection
5. **Test Data Ready**: 7 users and 6 properties already created

---

## Next Steps After Testing

1. **If agent login works**: Test all other functionalities
2. **If agent login fails**: 
   - Document console output
   - Check which detection method failed
   - We'll debug from there
3. **For any issues**: 
   - Attach console screenshots
   - Note exact URL redirected to
   - Note what dashboard displays
   - This helps us debug more accurately

---

**Ready to test? Let's go! 🚀**

Open browser, F12, navigate to http://localhost:5173, and login with agent1@test.com / agent123

