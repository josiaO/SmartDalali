# Environment Variables Setup Guide

This guide explains how to configure environment variables for both the backend and frontend of SmartDalali.

## Quick Start

1. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your actual values
   ```

## Backend Environment Variables

### Required for Production

- `SECRET_KEY` - Django secret key (generate a new one for production!)
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Comma-separated list of allowed hostnames
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of frontend URLs
- `CSRF_TRUSTED_ORIGINS` - Comma-separated list of trusted origins

### Database Configuration

**SQLite (Development - default):**
- Leave database variables empty to use SQLite

**PostgreSQL (Production - recommended):**
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=smartdalali
DB_USER=smartdalali_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
```

### Third-Party Services

#### Google Maps API
- `GOOGLE_MAPS_API_KEY` - Required for property geocoding
- Get from: https://console.cloud.google.com/google/maps-apis

#### Email Configuration
**SMTP (Development):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

**SendGrid (Production - recommended):**
```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_DEFAULT_FROM=noreply@smartdalali.com
```

#### AWS S3 (Optional - for media storage)
```env
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

#### Social Authentication
- `SOCIAL_GOOGLE_CLIENT_ID` / `SOCIAL_GOOGLE_SECRET`
- `SOCIAL_FACEBOOK_CLIENT_ID` / `SOCIAL_FACEBOOK_SECRET`
- `SOCIAL_MICROSOFT_CLIENT_ID` / `SOCIAL_MICROSOFT_SECRET`
- `SOCIAL_APPLE_CLIENT_ID` / `SOCIAL_APPLE_SECRET`

#### Payment Integration
**M-Pesa (Daraja API):**
```env
DAR_AFFILIATE_CONSUMER_KEY=your_consumer_key
DAR_AFFILIATE_CONSUMER_SECRET=your_consumer_secret
```
Get from: https://developer.safaricom.co.ke/

**Stripe:**
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### SMS Integration (Twilio - Optional)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Firebase Admin SDK
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

#### Error Tracking (Sentry - Optional)
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.2
```

#### Redis (Optional - for caching and WebSockets)
```env
REDIS_URL=redis://localhost:6379/0
# Or with password: redis://:password@localhost:6379/0
```

## Frontend Environment Variables

### Required

- `VITE_API_URL` - Backend API base URL
  - Development: `/api/v1` (uses Vite proxy)
  - Production: `https://api.smartdalali.com/api/v1`

### Optional

- `VITE_WS_URL` - WebSocket URL (auto-derived from VITE_API_URL if not set)
- `VITE_GOOGLE_MAPS_API_KEY` - For frontend map displays
- `VITE_STRIPE_PUBLISHABLE_KEY` - For payment forms
- `VITE_BACKEND_URL` - Backend URL for Vite proxy (development only)
- `VITE_PORT` - Development server port (default: 5173)

### Firebase Configuration
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Feature Flags
```env
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_SENTRY_DSN=
VITE_GA_TRACKING_ID=
```

## Security Best Practices

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Use different secrets for development and production**
3. **Generate a new `SECRET_KEY` for production:**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
4. **Use environment-specific `.env` files** (e.g., `.env.production`, `.env.staging`)
5. **Rotate secrets regularly** in production
6. **Use secret management services** (AWS Secrets Manager, HashiCorp Vault, etc.) in production

## Production Deployment

For production deployments, consider:

1. **Using a secrets management service** instead of `.env` files
2. **Setting environment variables** directly in your hosting platform:
   - Heroku: `heroku config:set KEY=value`
   - AWS: Use Systems Manager Parameter Store or Secrets Manager
   - Docker: Use Docker secrets or environment files
   - Kubernetes: Use ConfigMaps and Secrets

3. **Using different `.env` files** for different environments:
   - `.env.development`
   - `.env.staging`
   - `.env.production`

## Troubleshooting

### Backend can't read environment variables
- Ensure `python-dotenv` is installed: `pip install python-dotenv`
- Check that `.env` file is in the `backend/` directory
- Verify `load_dotenv()` is called in `settings.py`

### Frontend can't read environment variables
- Vite only exposes variables prefixed with `VITE_`
- Restart the dev server after changing `.env` files
- Check that variables are in `frontend/.env`, not `backend/.env`

### CORS errors
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check that `CSRF_TRUSTED_ORIGINS` includes your frontend URL
- Verify both are comma-separated without spaces (or with spaces that are trimmed)

## Additional Resources

- [Django Environment Variables Best Practices](https://docs.djangoproject.com/en/stable/topics/settings/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [12-Factor App: Config](https://12factor.net/config)

