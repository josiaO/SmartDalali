# SmartDalali Role-Based System - Complete Documentation

## System Overview

SmartDalali implements a comprehensive role-based authentication and authorization system with three main user roles:

1. **Superuser/Admin** - Full system access
2. **Agent** - Can list properties, manage own listings
3. **User** - Can browse properties, save favorites

---

## Architecture

### Backend Role System

```
Database Layer
├── User Model (Django)
├── Group Model (Django) 
│   └── 'agent' group (for agents)
├── Profile Model (OneToOne with User)
└── AgentProfile Model (OneToOne with Profile)

Authentication Layer  
├── JWT Token Generation (on login)
├── Role Detection (get_user_role function)
└── User Serialization (UserSerializer with role field)
```

### Frontend Role System

```
React Context (AuthContext)
├── User State (role, email, profile, agent_profile)
├── Role Detection (normalizeUser function)
├── Route Protection (ProtectedRoute component)
├── Dashboard Routing (getDashboardRoute function)
└── Navigation (redirectByRole function)
```

---

## Data Flow Diagram

### Login Process

```
User Input (email, password)
    ↓
Frontend: accountsService.login(email, password)
    ↓
Backend: POST /api/v1/accounts/auth/token/
    ↓
Backend: Authenticate user, generate JWT tokens
    ↓
Response: { access: "JWT", refresh: "JWT" }
    ↓
Frontend: Store tokens in localStorage
    ↓
Frontend: Fetch profile with token
    ↓
Backend: GET /api/v1/accounts/me/
    ↓
Backend: Load user, profile, agent_profile
    ↓
Backend: Compute role using get_user_role()
    ↓
Backend: UserSerializer returns full data with role field
    ↓
Response: {
  id, username, email, role, groups,
  profile: {...},
  agent_profile: {...}
}
    ↓
Frontend: normalizeUser(data) converts to User type
    ↓
Frontend: Role detection:
  1. Check data.role from backend (preferred)
  2. Fallback: Check is_superuser flag
  3. Fallback: Check groups.includes("agent")
    ↓
Frontend: getDashboardRoute(user) determines path
    ↓
Frontend: redirectByRole(navigate, user) navigates
    ↓
React Router: Navigate to /admin, /agent, or /dashboard
    ↓
ProtectedRoute: Verify user role matches route
    ↓
Display: Correct dashboard component
```

---

## Role Detection Logic

### Backend (get_user_role in accounts/roles.py)

```python
def get_user_role(user):
    """Determine user role from permissions/groups."""
    if user.is_superuser:
        return "admin"
    elif user.groups.filter(name='agent').exists():
        return "agent"
    else:
        return "user"
```

### Frontend (normalizeUser in AuthContext.tsx)

```typescript
function normalizeUser(data: any): User {
  // Comprehensive debug logging
  console.log("Raw backend user data:", JSON.stringify(data, null, 2));
  console.log("data.role (from backend):", data.role);
  
  // Multi-level role detection
  let assignedRole: UserRole;
  if (data.role === "superuser" || data.role === "agent" || data.role === "user") {
    // PRIMARY: Use backend's pre-computed role (source of truth)
    assignedRole = data.role as UserRole;
    console.log("Using role from backend:", assignedRole);
  } else {
    // FALLBACK: Compute from is_superuser and groups
    const isAgent = Array.isArray(data.groups) && data.groups.includes("agent");
    assignedRole = data.is_superuser ? "superuser" : isAgent ? "agent" : "user";
    console.log("Computed role from is_superuser and groups:", assignedRole);
  }
  
  return {
    id: data.id,
    username: data.username || data.email?.split("@")[0] || "",
    email: data.email || "",
    role: assignedRole,
    is_superuser: !!data.is_superuser,
    groups: data.groups || [],
    profile: { ... },
    agent_profile: assignedRole === "agent" && data.agent_profile ? { ... } : undefined
  };
}
```

### Frontend Routing (getDashboardRoute)

```typescript
const getDashboardRoute = (u: User | null = user) => {
  if (!u) return "/login";
  switch (u.role) {
    case "superuser":
      return "/admin";
    case "agent":
      return "/agent";  // ← Agent users should come here
    case "user":
    default:
      return "/dashboard";
  }
};
```

---

## Routes Protected by Role

### Admin Routes
```
/admin/*
├── Requires: role === "superuser"
├── Component: AdminDashboard
└── Access: Users with is_superuser=true
```

### Agent Routes
```
/agent/*
├── Requires: role === "agent"
├── Component: AgentDashboard
└── Access: Users in 'agent' group

/properties/new
├── Requires: role === "agent"
├── Component: PropertyForm
└── Access: Agents only

/properties/:id/edit
├── Requires: role === "agent"
├── Component: PropertyForm
└── Access: Agents only
```

### User Routes
```
/dashboard/*
├── Requires: role === "user"
├── Component: UserDashboard
└── Access: Regular users

/
├── Public
├── Component: Home
└── Access: Everyone

/properties
├── Public
├── Component: Properties
└── Access: Everyone

/map
├── Public
├── Component: MapView
└── Access: Everyone
```

---

## Database Schema

### User Table (Django built-in)
```
id, username, email, password, first_name, last_name,
is_active, is_staff, is_superuser, date_joined, last_login
```

### User Groups (Django built-in)
```
Groups:
- 'agent': Users who are real estate agents
- (others can be added as needed)
```

### Profile Table (OneToOne with User)
```
id, user_id (FK), name, phone_number, address, image, code, created_at
```

### AgentProfile Table (OneToOne with Profile)
```
id, user_id (OneToOne), profile_id (OneToOne),
agency_name, phone, verified, subscription_active, subscription_expires
```

### Property Table
```
id, owner_id (FK to User/Agent), title, description, price,
type, area, rooms, bedrooms, bathrooms, status, parking, year_built,
city, address, latitude, longitude, google_place_id,
is_published, is_paid, featured_until, view_count,
created_at, updated_at
```

---

## API Endpoints Summary

### Authentication
```
POST /api/v1/accounts/auth/token/
├── Input: { email, password }
├── Output: { access, refresh }
└── Auth: None

GET /api/v1/accounts/me/
├── Input: None (uses auth header)
├── Output: Complete user data with role
└── Auth: Required (Bearer token)

POST /api/v1/accounts/auth/refresh/
├── Input: { refresh }
├── Output: { access, refresh }
└── Auth: None

POST /api/v1/accounts/auth/logout/
├── Input: { refresh }
├── Output: { success }
└── Auth: None
```

### User Management
```
POST /api/v1/accounts/auth/register/
├── Input: { username, email, password, is_agent }
├── Output: Success message
└── Auth: None

POST /api/v1/accounts/auth/signup/
├── Similar to register with different validation
└── Auth: None
```

### Properties
```
GET /api/v1/properties/
├── Output: List of properties
├── Filters: By owner (agents), status, type, etc.
└── Auth: Optional (better results if authenticated)

POST /api/v1/properties/
├── Input: Property data
├── Output: Created property
└── Auth: Required (Agent only)

PUT /api/v1/properties/:id/
├── Input: Updated property data
├── Output: Updated property
└── Auth: Required (Owner or Admin)

DELETE /api/v1/properties/:id/
├── Auth: Required (Owner or Admin)
```

---

## Test Data

### User Accounts
```
Admin:     admin_test (admin@test.com, is_superuser=true)
Agent 1:   agent1_test (agent1@test.com, groups=['agent'])
Agent 2:   agent2_test (agent2@test.com, groups=['agent'])
Agent 3:   agent3_test (agent3@test.com, groups=['agent'])
User 1:    buyer1_test (buyer1@test.com, groups=[])
User 2:    buyer2_test (buyer2@test.com, groups=[])
User 3:    seller1_test (seller1@test.com, groups=[])
```

### Properties
```
Agent 1 Properties:
- Modern Downtown Apartment ($250,000) - Published, Paid
- Commercial Land Plot ($1,200,000) - Published, Paid

Agent 2 Properties:
- Beautiful Family House ($450,000) - Published, Paid
- Cozy Studio Apartment ($150,000) - Published, Not Paid

Agent 3 Properties:
- Luxury Villa ($850,000) - Published, Paid
- Office Space ($350,000) - Published, Not Paid
```

---

## Expected Behavior After Login

### Admin User Logged In
```
Step 1: Frontend detects role="admin"
Step 2: redirectByRole navigates to "/admin"
Step 3: ProtectedRoute verifies role matches
Step 4: AdminDashboard component renders
Step 5: Admin has access to:
  - User management
  - Agent verification
  - System settings
  - Statistics
```

### Agent User Logged In
```
Step 1: Frontend detects role="agent"
Step 2: redirectByRole navigates to "/agent"
Step 3: ProtectedRoute verifies role matches
Step 4: AgentDashboard component renders
Step 5: Agent has access to:
  - Own profile & agency info
  - Property listings management
  - Subscription status
  - Statistics
  - Edit/delete own properties
```

### Regular User Logged In
```
Step 1: Frontend detects role="user"
Step 2: redirectByRole navigates to "/dashboard"
Step 3: ProtectedRoute verifies role matches
Step 4: UserDashboard component renders
Step 5: User has access to:
  - Saved properties
  - Scheduled visits
  - Messages with agents
  - Profile management
```

---

## Common Issues & Solutions

### Issue: Agent redirected to user dashboard
**Debug Steps:**
1. Check console logs during login (F12 → Console)
2. Verify "Final assigned role: agent" appears in logs
3. Check if redirected to `/dashboard` or `/agent` (check URL)
4. If role correct but redirect wrong: Check routing config
5. If role wrong: Check backend API response

**Backend Verification:**
```bash
# Get agent token
curl -X POST http://localhost:8000/api/v1/accounts/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@test.com","password":"agent123"}'

# Use token to verify role
curl -X GET http://localhost:8000/api/v1/accounts/me/ \
  -H "Authorization: Bearer <TOKEN>"

# Should show "role": "agent"
```

### Issue: Login fails
**Causes:**
- Backend not running
- Wrong credentials
- Database not initialized
- JWT settings misconfigured

**Solutions:**
- Verify backend: `curl http://localhost:8000/api/v1/accounts/me/`
- Check credentials in TEST_GUIDE.md
- Run migrations: `python manage.py migrate`
- Check backend logs

### Issue: Profile data not showing
**Causes:**
- Profile not created when user registered
- AgentProfile missing for agent users
- Serializer error

**Solutions:**
- Verify profile exists in database
- For agents: Check AgentProfile exists and points to Profile
- Check serializer output in Django shell

---

## Development Commands

### Start Backend
```bash
cd backend
python manage.py runserver 8000
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Test Backend API
```bash
cd backend
python manage.py shell

# Then run any Django shell commands for testing
```

### Run Migrations
```bash
cd backend
python manage.py migrate
```

### Create Test Data
```bash
cd backend
python manage.py shell < create_test_data.py
```

---

## File Locations

### Backend
```
backend/
├── accounts/
│   ├── roles.py          ← Role detection logic
│   ├── serializers.py    ← UserSerializer with role field
│   ├── views.py          ← Auth endpoints
│   └── urls.py          ← Auth routes
├── properties/
│   ├── models.py         ← Property, AgentProfile models
│   └── views.py          ← Property endpoints
└── manage.py
```

### Frontend
```
frontend/src/
├── contexts/
│   └── AuthContext.tsx   ← Role detection, routing
├── pages/
│   ├── Login.tsx          ← Login form, redirectByRole
│   ├── AdminDashboard.tsx ← Admin-only dashboard
│   ├── AgentDashboard.tsx ← Agent-only dashboard
│   └── UserDashboard.tsx  ← User dashboard
├── App.tsx               ← Routes configuration
└── services/
    └── accounts.ts       ← API service calls
```

---

## Version & Compatibility

- **Django**: 5.1
- **Django REST Framework**: 3.14.0
- **React**: 18.3.1
- **React Router**: v6
- **TypeScript**: Latest
- **Python**: 3.13+
- **Node**: 20+

---

## Support & Debugging

For any issues:
1. Check console logs (F12 → Console)
2. Check backend logs (terminal where backend runs)
3. Run Django shell tests
4. Use API endpoints directly via curl
5. Clear browser cache and localStorage
6. Restart both backend and frontend

---

**Documentation Generated**: November 18, 2025  
**Last Updated**: November 18, 2025

