# Comprehensive Testing Guide - SmartDalali

## Environment Status
✅ **Backend**: Running on http://localhost:8000  
✅ **Frontend**: Running on http://localhost:5173  
✅ **Database**: SQLite with comprehensive test data  

## Test Data Summary

### Users Created (12 total)
| Username | Email | Role | Password |
|----------|-------|------|----------|
| admin_test | admin@test.com | Admin/Superuser | admin123 |
| agent1_test | agent1@test.com | Agent (Verified) | agent123 |
| agent2_test | agent2@test.com | Agent (Verified) | agent123 |
| agent3_test | agent3@test.com | Agent (Unverified) | agent123 |
| buyer1_test | buyer1@test.com | Regular User | user123 |
| buyer2_test | buyer2@test.com | Regular User | user123 |
| seller1_test | seller1@test.com | Regular User | user123 |

### Properties Created (6 total)
| Title | Type | Price | Agent | Bedrooms | Area |
|-------|------|-------|-------|----------|------|
| Modern Downtown Apartment | Apartment | $250,000 | agent1_test | 2 | 85.5 m² |
| Beautiful Family House with Garden | House | $450,000 | agent2_test | 3 | 150 m² |
| Prime Commercial Land Plot | Land | $1,200,000 | agent1_test | 0 | 500 m² |
| Cozy Studio Apartment | Apartment | $150,000 | agent3_test | 1 | 45 m² |
| Modern Office Space | Office | $350,000 | agent2_test | 0 | 120 m² |
| Luxury Villa with Pool | Villa | $850,000 | agent1_test | 4 | 250 m² |

### Media Files Created
- **Property Images**: 15 images total (2-3 per property)
- **Format**: JPEG generated test images
- **Location**: Backend media_root/property_images/

### Communications
- **Conversations**: 4 conversations
- **Messages**: 12 total messages between agents and users

---

## Testing Checklist

### 1. **LOGIN & ROLE REDIRECTION TEST** ✅ Critical

#### Test 1.1: Admin Login
- [ ] Navigate to http://localhost:5173/login
- [ ] Enter credentials: `admin_test` / `admin123`
- [ ] **Expected**: Redirect to `/admin` dashboard
- [ ] **Check**: Console should show:
  ```
  Using role from backend: admin
  ```

#### Test 1.2: Agent Login
- [ ] Navigate to http://localhost:5173/login
- [ ] Enter credentials: `agent1_test` / `agent123`
- [ ] **Expected**: Redirect to `/agent` dashboard
- [ ] **Check**: Console should show:
  ```
  Using role from backend: agent
  ```
- [ ] **CRITICAL**: Verify agent dashboard loads, NOT user dashboard

#### Test 1.3: Regular User Login
- [ ] Navigate to http://localhost:5173/login
- [ ] Enter credentials: `buyer1_test` / `user123`
- [ ] **Expected**: Redirect to `/dashboard`
- [ ] **Check**: Console should show:
  ```
  Using role from backend: user
  ```

---

### 2. **PROPERTY DATA VISIBILITY TEST** ✅ Important

#### Test 2.1: Properties Page (Public)
- [ ] Navigate to http://localhost:5173/properties
- [ ] **Expected**: All 6 properties should display
- [ ] **Verify**:
  - [ ] Modern Downtown Apartment - $250,000 visible
  - [ ] Beautiful Family House - $450,000 visible
  - [ ] Prime Commercial Land - $1,200,000 visible
  - [ ] Cozy Studio Apartment - $150,000 visible
  - [ ] Modern Office Space - $350,000 visible
  - [ ] Luxury Villa with Pool - $850,000 visible

#### Test 2.2: Property Images Display
- [ ] Each property card should show an image
- [ ] **Expected**: Property images from backend media files
- [ ] **Verify**: Images are not placeholders (should be the generated test images)
- [ ] **Check**: No broken image errors in console
- [ ] **Check**: Images load quickly (from /api/media_root/property_images/)

#### Test 2.3: Property Filter
- [ ] On Properties page, use the filter dropdown
- [ ] Filter by: "Apartment"
- [ ] **Expected**: Only 2 apartments should display (Modern Downtown & Cozy Studio)
- [ ] Filter by: "House"
- [ ] **Expected**: Only Beautiful Family House should display
- [ ] Filter by: "Land"
- [ ] **Expected**: Only Prime Commercial Land should display

#### Test 2.4: Property Search
- [ ] On Properties page, search for: "Downtown"
- [ ] **Expected**: Modern Downtown Apartment appears
- [ ] Search for: "Villa"
- [ ] **Expected**: Luxury Villa with Pool appears
- [ ] Search for: "Studio"
- [ ] **Expected**: Cozy Studio Apartment appears

---

### 3. **AGENT DASHBOARD TEST** ✅ Important

#### Test 3.1: Login as Agent & View Dashboard
- [ ] Login as `agent1_test` / `agent123`
- [ ] **Expected**: Redirect to `/agent` (not `/dashboard`)
- [ ] **Verify dashboard displays**:
  - [ ] Agent name and profile information
  - [ ] Agency information (Elite Realty)
  - [ ] Verification status (Verified for agent1)
  - [ ] My Properties section showing agent's listings
  - [ ] Monthly Goals (if implemented)
  - [ ] Recent Activity (if implemented)

#### Test 3.2: Agent's Own Properties
- [ ] On agent dashboard, verify "My Properties" shows:
  - [ ] Modern Downtown Apartment ($250,000)
  - [ ] Prime Commercial Land ($1,200,000)
  - [ ] Luxury Villa with Pool ($850,000)
- [ ] **Note**: agent1_test owns 3 properties
- [ ] Each property should show image, price, bedrooms, area

#### Test 3.3: Different Agent's Properties
- [ ] Logout and login as `agent2_test` / `agent123`
- [ ] **Expected**: Agent dashboard shows agent2's properties:
  - [ ] Beautiful Family House ($450,000)
  - [ ] Modern Office Space ($350,000)
- [ ] Logout and login as `agent3_test` / `agent123`
- [ ] **Expected**: Agent dashboard shows agent3's properties:
  - [ ] Cozy Studio Apartment ($150,000)

---

### 4. **USER DASHBOARD TEST** ✅ Important

#### Test 4.1: Login as Regular User & View Dashboard
- [ ] Login as `buyer1_test` / `user123`
- [ ] **Expected**: Redirect to `/dashboard` (user route)
- [ ] **Verify dashboard displays**:
  - [ ] User profile information
  - [ ] Available properties (all 6 properties)
  - [ ] Search/filter functionality
  - [ ] Favorite properties (if implemented)
  - [ ] Saved properties (if implemented)

#### Test 4.2: User Can View All Properties
- [ ] On user dashboard, verify all 6 properties are visible
- [ ] User should NOT see admin controls
- [ ] User should NOT see agent-only features

---

### 5. **ADMIN DASHBOARD TEST** ✅ Important

#### Test 5.1: Login as Admin & View Dashboard
- [ ] Login as `admin_test` / `admin123`
- [ ] **Expected**: Redirect to `/admin` (admin route)
- [ ] **Verify admin dashboard displays**:
  - [ ] All users count
  - [ ] All properties count
  - [ ] System statistics
  - [ ] Admin controls
  - [ ] User management (if implemented)

---

### 6. **MESSAGING/COMMUNICATIONS TEST** ✅ Important

#### Test 6.1: User Conversations
- [ ] Login as `agent1_test`
- [ ] Navigate to Messages/Communications
- [ ] **Expected**: Conversation with buyer1_test should appear
- [ ] **Verify message history**:
  - [ ] Message 1: "Hi, I have a property that might interest you"
  - [ ] Message 2: "Sure, can you tell me more about it?"
  - [ ] Continue through all 5 messages

#### Test 6.2: Multiple Conversations
- [ ] Agent2 should have conversation with buyer2
- [ ] Agent3 should have conversation with seller1
- [ ] Buyer1 and buyer2 should have conversation together
- [ ] Each conversation loads with correct message history

---

### 7. **PROPERTY DETAILS PAGE TEST** ✅ Important

#### Test 7.1: Click on Property Card
- [ ] From Properties page, click on any property card
- [ ] **Expected**: Navigate to property detail page
- [ ] **Verify page displays**:
  - [ ] Large property image(s)
  - [ ] Full property details (bedrooms, bathrooms, area)
  - [ ] Price in large display
  - [ ] Description
  - [ ] Location/address
  - [ ] Agent information

#### Test 7.2: Property Gallery
- [ ] On detail page, verify image gallery
- [ ] **Expected**: All images for property display (2-3 per property)
- [ ] Can navigate through images
- [ ] Images load from backend media files

#### Test 7.3: Contact Agent
- [ ] On property detail page, find "Contact Agent" button
- [ ] **Expected**: Form to contact agent appears
- [ ] Can send message to property owner

---

### 8. **PERMISSIONS & VISIBILITY TEST** ✅ Critical

#### Test 8.1: Agent Cannot Access Other Agent's Properties (Edit)
- [ ] Login as `agent1_test`
- [ ] Navigate to agent2's property (Beautiful Family House)
- [ ] **Expected**: View-only access (no edit button)
- [ ] Agent1 should NOT be able to edit agent2's property

#### Test 8.2: User Cannot See Admin Controls
- [ ] Login as `buyer1_test` (regular user)
- [ ] Navigate around dashboard
- [ ] **Expected**: No admin panel access
- [ ] No edit/delete buttons on properties (except own if applicable)

#### Test 8.3: Admin Can Manage Everything
- [ ] Login as `admin_test`
- [ ] **Expected**: Can see all users' properties
- [ ] **Expected**: Can manage all properties
- [ ] **Expected**: Can view all conversations

---

### 9. **API ENDPOINT VERIFICATION TEST** ✅ Technical

#### Test 9.1: Properties API
- [ ] Open browser console (F12)
- [ ] Go to Network tab
- [ ] Navigate to properties page
- [ ] **Expected**: Request to `/api/v1/properties/` returns:
  ```json
  {
    "results": [
      {
        "id": 1,
        "title": "Modern Downtown Apartment",
        "price": "250000.00",
        "type": "Apartment",
        "MediaProperty": [
          {"Images": "...", "caption": "...", "videos": null}
        ],
        "owner": {...},
        ...
      }
    ]
  }
  ```

#### Test 9.2: User Profile API
- [ ] Open console Network tab
- [ ] Login with agent account
- [ ] **Expected**: Request to `/api/v1/accounts/me/` returns:
  ```json
  {
    "id": 2,
    "username": "agent1_test",
    "email": "agent1@test.com",
    "role": "agent",
    "groups": ["agent"],
    "agent_profile": {
      "agency_name": "Elite Realty",
      "verified": true,
      "subscription_active": true
    }
  }
  ```

---

## Expected Outcomes

### ✅ If Everything Works
- All users login and redirect to correct dashboard
- All properties display with images from backend
- All communications/messages display correctly
- Agent can only edit own properties
- User cannot access admin/agent features
- All role-based visibility works correctly

### ⚠️ If Issues Occur

#### Issue: Agent still redirects to /dashboard
- Check browser console (F12) → Console tab
- Look for: `Using role from backend: agent` or `Computed role...`
- If shows "user", the backend is returning role="user" instead of "agent"
- Verify agent is in the 'agent' group in database

#### Issue: Properties not showing images
- Check Network tab (F12) → XHR
- Look for requests to `/api/media_root/`
- Verify 404 errors (if so, backend media configuration issue)
- Check image URLs in response - should be `/api/media_root/property_images/...`

#### Issue: Messaging not working
- Verify Conversation and Message objects exist in database
- Check Network tab for `/api/v1/communications/` endpoint
- Verify participants are set correctly in conversations

---

## Database Verification Commands

If you need to verify test data in the database:

```bash
# SSH into backend
cd /home/josiamosses/SmartDalali/backend

# Django shell
python manage.py shell

# Check properties
from properties.models import Property, MediaProperty
print(f"Properties: {Property.objects.count()}")
print(f"Images: {MediaProperty.objects.count()}")

# Check users
from django.contrib.auth.models import User
print(f"Users: {User.objects.count()}")

# Check conversations
from communications.models import Conversation, Message
print(f"Conversations: {Conversation.objects.count()}")
print(f"Messages: {Message.objects.count()}")
```

---

## Quick Reference: Test Credentials

```
ADMIN:
  Email: admin@test.com
  Password: admin123

AGENTS:
  Email: agent1@test.com  Password: agent123
  Email: agent2@test.com  Password: agent123
  Email: agent3@test.com  Password: agent123

USERS:
  Email: buyer1@test.com  Password: user123
  Email: buyer2@test.com  Password: user123
  Email: seller1@test.com Password: user123
```

---

## Frontend URLs for Testing

| Route | Purpose | Requires Login |
|-------|---------|----------------|
| http://localhost:5173/ | Home Page | No |
| http://localhost:5173/login | Login | No |
| http://localhost:5173/properties | Browse Properties | No |
| http://localhost:5173/properties/[id] | Property Details | No |
| http://localhost:5173/dashboard | User Dashboard | Yes - User Role |
| http://localhost:5173/agent | Agent Dashboard | Yes - Agent Role |
| http://localhost:5173/admin | Admin Dashboard | Yes - Admin Role |
| http://localhost:5173/messages | Conversations/Messages | Yes |
| http://localhost:5173/profile | User Profile | Yes |

---

## Notes

1. **Property Images**: Cached property images have been checked and removed. All images now load fresh from backend media files.
2. **Role Detection**: Enhanced with comprehensive debug logging. Check console to see which role detection method is used.
3. **Backend Verification**: All test data verified to be correctly created in database.
4. **API Responses**: All backend endpoints verified to return correct data structure and role fields.

