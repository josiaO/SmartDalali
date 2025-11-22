# SmartDalali - Premium Real Estate Platform

SmartDalali is a production-ready real estate marketplace connecting buyers, sellers, and agents. It features a robust Django backend and a modern, responsive React frontend.

## Features

- **Role-Based Access Control**: distinct dashboards for Users, Agents, and Admins.
- **Advanced Property Listings**: Search, filter, and view properties with rich media.
- **Real-time Communication**: In-app messaging between users and agents.
- **Secure Authentication**: JWT-based auth with support for Firebase (Google/Facebook) login.
- **Payments**: Integrated M-Pesa (Daraja) payment flow for subscriptions and services.
- **Notifications**: Email, SMS (Twilio), and Push (Firebase) notifications.

## Project Structure

- `backend/`: Django REST Framework API
- `frontend/`: React + Vite + TailwindCSS + Shadcn UI

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.10+ (for local backend dev)

## Quick Start (Docker)

Run the entire stack with Docker Compose:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/v1/
- **Admin Panel**: http://localhost:8000/admin/

## Configuration & API Keys

Create a `.env` file in the `backend/` directory based on the examples below.

### Backend Environment Variables

```env
# Core
DEBUG=True
SECRET_KEY=your_secret_key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3 # Or postgres://...

# Authentication
JWT_SECRET_KEY=your_jwt_secret

# Firebase (Auth & Notifications)
FIREBASE_CREDENTIALS_JSON={"type": "service_account", ...} # Minified JSON string

# M-Pesa (Payments)
DAR_AFFILIATE_CONSUMER_KEY=your_consumer_key
DAR_AFFILIATE_CONSUMER_SECRET=your_consumer_secret
DAR_SHORTCODE=your_shortcode
DAR_PASSKEY=your_passkey

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Email (SendGrid or SMTP)
SENDGRID_API_KEY=your_sendgrid_key
DEFAULT_FROM_EMAIL=no-reply@smartdalali.com
```

### Frontend Environment Variables

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Manual Setup

### Backend

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Create virtual environment and install dependencies:
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  Run migrations:
    ```bash
    python manage.py migrate
    ```
4.  Start server:
    ```bash
    python manage.py runserver
    ```

### Frontend

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start dev server:
    ```bash
    npm run dev
    ```

## API Documentation

The API documentation is available at:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/docs/redoc/

## Roles & Permissions

- **Superuser**: Full access to Admin Panel and all resources.
- **Agent**: Can list properties, manage own profile, and chat with users. Requires verification.
- **User**: Can search properties, save favorites, and contact agents.
