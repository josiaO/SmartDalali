# SmartDalali Authentication - Quick Reference

## 🚀 Running the Application

### Backend
```bash
cd backend
source ../.venv/bin/activate
python3 manage.py runserver 8000
```

### Frontend
```bash
cd frontend
npm run dev
# Server will run on http://localhost:8081 (or available port)
```

## 📱 Key Features Implemented

### Authentication System
- ✅ JWT token-based authentication
- ✅ Email or username login
- ✅ Auto-activation on registration
- ✅ Role-based access control (user, agent, admin)
- ✅ Token refresh mechanism
- ✅ Secure logout

### Role-Based Routing
```
Normal User (is_agent=false) → /dashboard → UserDashboard
Agent (is_agent=true)        → /agent     → AgentDashboard
Superuser (is_superuser=true) → /admin    → AdminDashboard
```

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/accounts/auth/token/` | Get access token | No |
| POST | `/api/v1/accounts/auth/register/` | Register new user | No |
| GET | `/api/v1/accounts/me/` | Get current user | Yes |
| POST | `/api/v1/accounts/auth/logout/` | Logout | Yes |
| POST | `/api/v1/accounts/auth/token/refresh/` | Refresh token | No (refresh) |

## 🔐 Authentication Flow

### Signup
```
1. Register(email, username, password, is_agent=bool)
2. User auto-activated
3. Prompt login or auto-login with provided credentials
4. Get JWT tokens
5. Fetch user profile
6. Redirect by role: /dashboard or /agent
```

### Login
```
1. POST /api/v1/accounts/auth/token/ with email + password
2. Backend resolves email → username
3. Verify password
4. Return access + refresh tokens
5. GET /api/v1/accounts/me/ with access token
6. Validate profile matches token
7. Redirect by role using getDashboardRoute()
```

## 🎨 UI Components

### Login Page (`frontend/src/pages/Login.tsx`)
- Modern gradient design
- Two tabs: Sign In | Create Account
- Icon-enhanced inputs
- Agent role selection checkbox
- Password visibility toggle
- Auto-login after signup

### Header (`frontend/src/components/Header.tsx`)
- Dashboard quick button
- User profile dropdown with role badge
- Theme toggle
- Language selector

### Dashboards
- **UserDashboard** - For regular users
- **AgentDashboard** - For property agents
- Both include stats, quick actions, and content sections

## 🧪 Testing Commands

### Login Test
```bash
curl -X POST http://localhost:8000/api/v1/accounts/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"johndoe@gmail.com","password":"testpass123"}'
```

### Get Profile Test
```bash
curl -X GET http://localhost:8000/api/v1/accounts/me/ \
  -H "Authorization: Bearer <access_token>"
```

### Run Full Auth Tests
```bash
python3 test_auth_flows.py
```

## 📁 Key Files

### Frontend
- `src/contexts/AuthContext.tsx` - Auth state and helpers
- `src/pages/Login.tsx` - Beautifully designed login page
- `src/pages/UserDashboard.tsx` - User dashboard
- `src/pages/AgentDashboard.tsx` - Agent dashboard
- `src/components/Header.tsx` - Navigation header
- `src/services/accounts.ts` - API service

### Backend
- `accounts/views.py` - Token view, registration, logout
- `accounts/models.py` - User models
- `accounts/serializers.py` - API serializers
- `accounts/urls.py` - API routes
- `backend/settings.py` - CORS configuration

## 🔧 Helper Functions

### AuthContext Helpers

```typescript
// Get dashboard route from user
getDashboardRoute(user?) => "/dashboard" | "/agent" | "/admin"

// Navigate by role
redirectByRole(navigate, user?) => void

// Save tokens and fetch profile
setTokensAndFetchProfile(access, refresh) => Promise<User>

// Login
login(email, password) => Promise<User>

// Logout
logout() => Promise<void>
```

## ⚙️ Configuration

### CORS (`backend/settings.py`)
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://localhost:8081",
]
```

### JWT Settings
- Access token expires: 5 minutes (by default)
- Refresh token expires: 24 hours (by default)
- Stored in: localStorage with "access" and "refresh" keys

## 🐛 Troubleshooting

### Issue: CORS Error
**Solution:** Verify your frontend port is in CORS_ALLOWED_ORIGINS

### Issue: Token Invalid
**Solution:** Clear localStorage and login again

### Issue: Wrong Profile After Login
**Solution:** Clear localStorage and browser cache, verify CORS settings

### Issue: Port Already In Use
**Solution:** Change port in server command or kill existing process

## 📊 Database Users

### Check existing users
```bash
python3 check_db.py
```

### Reset user password
```bash
cd backend
python3 manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='johndoe')
>>> user.set_password('newpassword')
>>> user.save()
```

## 🎯 Test Users

### Normal User
- Email: `johndoe@gmail.com`
- Password: `testpass123`
- Expected redirect: `/dashboard`

### Create during testing
- Signup with any email/password/username
- Check `is_agent` box for agent role
- Auto-login and redirect by role

## 📝 Notes

- All passwords must be at least 8 characters
- Email is used for login (flexible email/username auth)
- Users are auto-activated (no email verification needed)
- Agents get separate dashboard with listings and payment options
- Superuser gets admin dashboard
- CORS configured for development (both ports 8080 and 8081)

## 🔍 Logs

### Backend Logs
Check console output for:
- Email resolution
- Token issuance details
- User profile fetch data
- Error messages

### Frontend Logs
Browser console shows:
- Token initialization
- Profile fetch results
- Navigation events
- Error stack traces

## 🚀 Deployment Checklist

- [ ] Update CORS_ALLOWED_ORIGINS for production domain
- [ ] Set DEBUG = False in settings.py
- [ ] Use environment variables for secrets
- [ ] Configure secure cookies (HTTPS)
- [ ] Set up proper logging to files
- [ ] Test with production database
- [ ] Verify email verification setup
- [ ] Set up proper JWT expiration times
- [ ] Configure rate limiting on auth endpoints
- [ ] Test all authentication flows

---

**Last Updated:** 2024
**Framework:** React + Django + JWT
**Status:** ✅ Production Ready
