# API Routes (versioned under `/api/v1/`)

| Path | Methods | Description |
|------|---------|-------------|
| `/api/v1/accounts/auth/token/` | POST | Obtain JWT (username & password). |
| `/api/v1/accounts/auth/token/refresh/` | POST | Refresh JWT using refresh token. |
| `/api/v1/accounts/auth/register/` | POST | Register a new user. |
| `/api/v1/accounts/auth/signup/` | POST | Legacy registration alias. |
| `/api/v1/accounts/auth/logout/` | POST | Logout current user/session. |
| `/api/v1/accounts/auth/routes/` | GET | List available account routes. |
| `/api/v1/accounts/auth/gpt/` | POST | GPT helper (legacy/debug). |
| `/api/v1/accounts/auth/<username>/activate/` | POST | Activate user account by token. |
| `/api/v1/accounts/me/` | GET | Retrieve current authenticated profile. |
| `/api/v1/accounts/profile/` | GET | Alias for `/me/`. |
| `/api/v1/accounts/profile/update/` | PUT/PATCH | Update profile details. |
| `/api/v1/accounts/users/` | GET/POST/... | User management viewset. |
| `/api/v1/accounts/profiles/` | GET/POST/... | CRUD for `Profile` objects. |
| `/api/v1/accounts/agent-profiles/` | GET/POST/... | Manage agent profiles. |
| `/api/v1/properties/` | GET/POST | List or create property listings. |
| `/api/v1/properties/<id>/` | GET/PUT/DELETE | Retrieve/update/delete listing. |
| `/api/v1/properties/visits/` | GET/POST | Manage property visits. |
| `/api/v1/properties/visits/<id>/` | GET/PUT/DELETE | Manage a specific visit. |
| `/api/v1/properties/payments/` | GET | Payments viewset (user/agent scoped). |
| `/api/v1/properties/payments/mpesa/stk/<property_id>/` | POST | Initiate M-Pesa STK push. |
| `/api/v1/properties/payments/mpesa/callback/` | POST | Safaricom callback handler. |
| `/api/v1/properties/payments/status/<payment_id>/` | GET | Poll payment status. |
| `/api/v1/properties/payments/admin-list/` | GET | Admin-only payment overview. |
| `/api/v1/properties/payments/<id>/retry/` | POST | Admin-only retry (marks pending). |
| `/api/v1/properties/geocode/` | POST | Geocode an address/city to latitude/longitude. |
| `/api/v1/properties/support/tickets/` | GET/POST | Support ticket CRUD. |
| `/api/v1/properties/support/tickets/<id>/` | GET/PUT/DELETE | Manage a ticket. |
| `/api/v1/properties/support/tickets/<id>/reply/` | POST | Add reply (user or staff). |
| `/api/v1/properties/support/tickets/<id>/assign/` | POST | Staff assigns ticket. |
| `/api/v1/properties/support/tickets/<id>/close/` | POST | Staff closes ticket. |
| `/api/v1/properties/support/tickets/stats/` | GET | Staff-only ticket stats. |
| `/api/v1/communications/conversations/` | GET | List user conversations. |
| `/api/v1/communications/conversations/start_conversation/` | POST | Start conversation with another user. |
| `/api/v1/communications/conversations/<id>/messages/` | GET | Messages inside conversation. |
| `/api/v1/communications/conversations/<id>/send_message/` | POST | Send message within conversation. |
| `/api/v1/communications/conversations/unread_count/` | GET | Total unread message notifications. |
| `/api/v1/communications/messages/` | GET | Read-only view of messages. |
| `/api/v1/communications/messages/<id>/mark_read/` | POST | Mark message as read. |
| `/api/v1/communications/notifications/` | GET/POST | CRUD for user notifications. |
| `/api/v1/communications/notifications/<id>/` | GET/PUT/DELETE | Manage single notification. |


### 4. Usage Notes
Authentication: Use JWT (/auth/token/) for API calls; include Authorization: Bearer <access> headers.
Permissions: Most endpoints require authentication. Payments support admin routes limited via IsAdmin. Support ticket assignment/close/stats require staff or superuser.
Search & ordering: listing/payment viewsets support ?search= and ?ordering= query parameters (e.g., ?ordering=-price).
Google Maps: property creation automatically geocodes city/adress if GOOGLE_MAPS_API_KEY is set; API returns latitude, longitude, and maps_url.

### 5. Keeping Docs Updated
Use the generate_api_routes command (if installed) to regenerate documentation:

  python manage.py generate_api_routes
