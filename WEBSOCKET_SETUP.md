# WebSocket Real-time Communication Setup Guide

## Overview

SmartDalali now supports real-time messaging through WebSocket connections. This guide explains the setup, architecture, and usage.

## Architecture

### Backend Components

1. **Django Channels** - WebSocket server framework
   - Location: `backend/communications/consumers.py`
   - Provides two main consumers:
     - `ChatConsumer`: Handles real-time chat for conversations
     - `NotificationConsumer`: Handles real-time notifications

2. **ASGI Application** - `backend/backend/asgi.py`
   - Routes HTTP requests and WebSocket connections
   - Handles authentication via middleware

3. **Routing** - `backend/communications/routing.py`
   - Maps WebSocket URLs to consumers
   - Endpoints:
     - `/ws/chat/<conversation_id>/` - Chat messages
     - `/ws/notifications/` - System notifications

4. **Message Encryption** - `backend/utils/encryption.py`
   - End-to-end encryption for messages
   - Uses Fernet (symmetric encryption)

5. **Notifications** - `backend/communications/notification_service.py`
   - Multi-channel notifications (email, SMS, push)
   - Sends via SendGrid, Twilio, Firebase

### Frontend Components

1. **WebSocket Service** - `frontend/src/services/websocket.ts`
   - Manages WebSocket connections
   - Automatic reconnection with exponential backoff
   - Handles multiple connection types

2. **Custom Hooks** - `frontend/src/hooks/useWebSocket.ts`
   - `useWebSocket()` - Generic WebSocket hook
   - `useChat()` - Chat-specific hook
   - `useNotifications()` - Notifications hook

3. **Components**
   - `frontend/src/components/RealtimeChat.tsx` - Chat UI with real-time features
   - `frontend/src/pages/Messages.tsx` - Updated messaging page

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `channels>=3.0.0` - WebSocket support
- `channels-redis>=4.0.0` - Redis layer for scaling (optional, uses in-memory by default)
- `cryptography>=3.4` - Message encryption
- `firebase-admin>=5.0.0` - Push notifications (optional)
- `twilio>=7.0.0` - SMS notifications (optional)

### 2. Configure Django Settings

In `backend/backend/settings.py`:

```python
INSTALLED_APPS = [
    # ... other apps
    'channels',
    'communications',
]

ASGI_APPLICATION = 'backend.asgi.application'

# Channel configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
        # OR for production with Redis:
        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
        # 'CONFIG': {
        #     'hosts': [('127.0.0.1', 6379)],
        # },
    }
}

# Message encryption key (use settings.SECRET_KEY if not set)
MESSAGE_ENCRYPTION_KEY = os.getenv('MESSAGE_ENCRYPTION_KEY')

# Optional notification services
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
```

### 3. Update Database

```bash
python manage.py migrate communications
```

### 4. Run Development Server

With Daphne ASGI server:

```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

Or with runserver (limited functionality):

```bash
python manage.py runserver
```

### 5. Configure Redis (Production)

For scaling WebSocket connections across multiple workers:

```bash
# Install Redis
docker run -d -p 6379:6379 redis:latest

# Update settings to use Redis layer
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    }
}
```

## Frontend Setup

### 1. Environment Variables

Create/update `.env` in frontend directory:

```bash
VITE_API_URL=http://localhost:8000
# For production: https://api.smartdalali.com
```

### 2. Usage in Components

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const { isConnected, sendMessage, typingUsers } = useWebSocket({
    conversationId: 123,
    autoConnect: true,
  });

  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      {/* Your component JSX */}
    </div>
  );
}
```

### 3. With Existing HTTP API

The frontend uses HTTP REST API for sending messages:

```typescript
// Send message (HTTP)
await communicationsService.sendConversationMessage(conversationId, {
  content: message,
});

// WebSocket receives new messages in real-time
useWebSocket({
  conversationId,
  onMessage: (message) => {
    if (message.type === 'message') {
      // Update UI with new message
    }
  },
});
```

## WebSocket Events

### Chat Consumer Events

**Client → Server:**
- `type: 'message'` - Send new message
- `type: 'typing'` - Typing indicator
- `type: 'read'` - Message read receipt

**Server → Client:**
- `type: 'message'` - New message received
- `type: 'typing'` - User typing indicator
- `type: 'read_receipt'` - Message read confirmation
- `type: 'notification'` - System notification
- `type: 'error'` - Error message

### Event Message Format

**Send Message:**
```json
{
  "type": "message",
  "content": "Hello, how are you?"
}
```

**Receive Message:**
```json
{
  "type": "message",
  "message": {
    "id": 123,
    "sender_id": 456,
    "content": "Hello, how are you?",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Typing Indicator:**
```json
{
  "type": "typing",
  "user_id": 456,
  "username": "john_doe",
  "is_typing": true
}
```

## Testing WebSocket Connections

### Using WebSocket Client (Browser Console)

```javascript
// Connect to chat
const ws = new WebSocket('ws://localhost:8000/ws/chat/1/');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'message',
    content: 'Test message'
  }));
};

ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};

ws.onclose = () => console.log('Disconnected');
ws.onerror = (error) => console.error('Error:', error);
```

### Using Python WebSocket Client

```python
import asyncio
import websockets
import json

async def test_chat():
    async with websockets.connect('ws://localhost:8000/ws/chat/1/') as ws:
        # Send message
        await ws.send(json.dumps({
            'type': 'message',
            'content': 'Test message'
        }))
        
        # Receive message
        response = await ws.recv()
        print('Received:', json.loads(response))

asyncio.run(test_chat())
```

## Deployment

### Docker Setup

Using provided `docker-compose.yml`:

```bash
docker-compose up -d
```

Make sure services are configured:
- Redis for channel layer (if scaling)
- Daphne or similar ASGI server
- Environment variables set in `.env`

### Nginx Configuration

For production with Nginx:

```nginx
upstream daphne {
    server localhost:8000;
}

server {
    listen 80;
    server_name api.smartdalali.com;

    location / {
        proxy_pass http://daphne;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS

Use WSS (WebSocket Secure) in production:

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat/1/`);
```

## Troubleshooting

### WebSocket Connection Fails

1. Check backend is running with Daphne
2. Verify ASGI_APPLICATION is set in settings
3. Check firewall/proxy allows WebSocket upgrades
4. Verify token/authentication is valid

### Messages Not Received

1. Ensure conversation participant is authenticated
2. Check message encryption/decryption keys match
3. Verify channel layer is working (test with Redis)
4. Check browser console for connection errors

### High Memory Usage

1. Enable Redis for channel layer
2. Increase worker processes
3. Monitor typing indicator cleanup
4. Check for connection leaks

## Performance Optimization

### Frontend
- Debounce typing indicators (implemented: 2s)
- Unsubscribe from WebSocket on unmount
- Lazy load message history
- Use virtual scrolling for large message lists

### Backend
- Use Redis channel layer for horizontal scaling
- Connection pooling for database
- Cache conversation participants
- Implement message pagination

## Security Considerations

1. **Authentication** - Always verify user is conversation participant
2. **Encryption** - Messages encrypted with Fernet (symmetric)
3. **Authorization** - Check permissions before accepting messages
4. **Rate Limiting** - Implement per-connection message throttling
5. **Input Validation** - Validate all incoming message data

## API Documentation

Full API documentation available in `API_ROUTES.md`

## Support

For issues or questions, please check:
- Backend logs: `docker logs smartdalali-backend`
- Frontend console: Browser Developer Tools
- Django logs for consumer errors
- Browser Network tab for WebSocket connection details
