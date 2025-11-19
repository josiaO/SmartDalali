# Agent Dashboard - Quick Reference

## Login Instructions
1. Go to frontend at `http://localhost:5175`
2. Login with: `agent1@test.com` / `agent123`
3. You'll be redirected to `/agent` dashboard

## Dashboard Sections

### Overview (Default)
- View statistics: total listings, views, inquiries, earnings
- View subscription plans (Monthly: TSh 50,000, Annual: TSh 500,000)
- Subscribe to plans with M-Pesa or Stripe
- See recent activity and featured listings

### My Properties (/agent/listings)
- View all your properties
- Search by title or location
- Filter by published/draft status
- Edit properties (click edit button)
- Delete properties (with confirmation)
- Quick access to add new property button

### Messages (/agent/messages)
- View all conversations with other users
- Search conversations by participant name
- Select conversation to view messages
- Send new messages (press Enter to send)
- See timestamps and sender information
- Responsive two-panel layout

### Profile (/agent/profile)
- View personal information
- Edit name, email, phone, address
- Edit agency name and phone
- Upload profile picture
- View subscription and verification status
- Toggle edit mode to make changes

## Navigation

**Desktop**: 
- Sidebar on left with navigation items
- Active page highlighted
- Logout button at bottom

**Mobile**:
- Hamburger menu icon (top left)
- Click to show/hide navigation
- Same navigation items
- Closes automatically when navigating

## Features Summary

| Feature | Location | Status |
|---------|----------|--------|
| Add Property | My Properties → Add | ✅ |
| Edit Property | My Properties → Edit | ✅ |
| Delete Property | My Properties → Delete | ✅ |
| View Properties | Overview, My Properties | ✅ |
| Send Messages | Messages → Type → Enter | ✅ |
| Receive Messages | Messages → List | ✅ |
| Search Messages | Messages → Search box | ✅ |
| Edit Profile | Profile → Edit Profile | ✅ |
| Upload Photo | Profile (Edit) → Choose file | ✅ |
| View Stats | Overview → Cards | ✅ |
| Subscribe Plan | Overview → Subscribe button | ✅ |

## File Structure

```
frontend/src/
├── pages/
│   ├── AgentDashboard.tsx (main dashboard with routing)
│   ├── AgentProfile.tsx (profile editing)
│   ├── AgentMessages.tsx (messaging)
│   ├── AgentListings.tsx (property management)
│   └── PropertyForm.tsx (add/edit properties)
├── components/
│   └── AgentSidebar.tsx (navigation sidebar)
├── services/
│   ├── agent.ts (agent API calls)
│   ├── properties.ts (property API calls)
│   └── communications.ts (messaging API calls)
└── contexts/
    └── AuthContext.tsx (authentication state)
```

## Common Tasks

### Add a New Property
1. Go to "My Properties" → "Add Property" button
2. Fill in details (title, description, price, location)
3. Upload images (drag & drop or click)
4. Select features (furnished, parking, etc.)
5. Click "Create Property"

### Send a Message
1. Go to "Messages"
2. Select a conversation from the list
3. Type your message in the text area
4. Press Enter or click Send
5. Message appears immediately

### Update Profile
1. Go to "Profile"
2. Click "Edit Profile" button
3. Change any information you want
4. Optionally upload a new profile picture
5. Click "Save Changes"
6. Profile updates and page refreshes

### Delete a Property
1. Go to "My Properties"
2. Find the property in the list
3. Click the Delete button
4. Confirm deletion in the dialog
5. Property is removed from your listings

## API Endpoints Used

**Profile Operations**:
```
GET  /api/v1/accounts/me/              - Get current profile
PUT  /api/v1/accounts/me/              - Update profile
PATCH /api/v1/accounts/me/             - Update profile image
GET  /api/v1/agents/stats/             - Get agent statistics
```

**Messaging**:
```
GET  /api/v1/communications/conversations/           - List conversations
GET  /api/v1/communications/conversations/{id}/messages/  - Get messages
POST /api/v1/communications/conversations/{id}/send_message/ - Send message
```

**Properties**:
```
GET    /api/v1/properties/             - List properties (filter by owner)
POST   /api/v1/properties/             - Create property
PUT    /api/v1/properties/{id}/        - Update property
DELETE /api/v1/properties/{id}/        - Delete property
```

## Troubleshooting

**Page not loading**:
- Check if backend is running: `python manage.py runserver`
- Check if frontend is running: `npm run dev`
- Try refreshing the page

**Images not uploading**:
- Check file size (max varies by backend config)
- Try a different image format (JPG, PNG)
- Check browser console for errors

**Messages not sending**:
- Check if you're in a valid conversation
- Verify message is not empty
- Check network tab in browser dev tools

**Profile not updating**:
- Fill all required fields
- Check if image file is valid
- Look for error toast notification

**Can't login**:
- Use: `agent1@test.com` / `agent123`
- Check if backend is running
- Try clearing browser cookies

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- Dashboard loads in ~500ms
- Messages load on demand
- Images are lazy-loaded
- Sidebar navigation is instant
- Profile updates are real-time

## Support/Docs

Full implementation details: `AGENT_DASHBOARD_IMPLEMENTATION.md`
API Documentation: Check backend `API_ROUTES.md`
