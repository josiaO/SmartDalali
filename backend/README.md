## SmartDalali Backend (Django)

### Overview
- `accounts`: user profiles, role helpers, custom admin + allauth system checks.
- `properties`: property listings plus merged payments and support ticket features.
- `communications`: messaging + notification APIs and websocket consumers.
- `utils`: shared helpers (`google_maps` geocoding, `generate_code`).

### Security & Roles
- Authentication is standard Django auth with DRF + SimpleJWT.
- Roles: `admin` (superuser), `agent` (members of the `agent` group), and `user`.
- Use `accounts.roles.get_user_role()` or permissions in `accounts.permissions`.
- Management command `python manage.py init_roles` seeds the default roles/groups.

### Permissions & Best Practices
- Payments API (`PaymentViewSet`) is read-only via REST; admin actions require the `IsAdmin` permission class.
- Support ticket actions (`assign`, `close`, `stats`) are limited to staff/admins.
- Conversations must be started through `POST /api/communications/conversations/start_conversation/`; raw `create/update/destroy` calls are blocked.
- Websocket authentication uses `AuthMiddlewareStack`; ensure sessions/JWT cookies are configured before deploying at scale.

### Google Maps Integration
- No GeoDjango/GDAL dependency. Properties store latitude/longitude + optional `google_place_id`.
- Set `GOOGLE_MAPS_API_KEY` in `.env` (and optionally `GOOGLE_MAPS_GEOCODE_TIMEOUT`).
- Geocoding failures are non-breaking—properties fall back to user-entered coordinates.

### Configuration Checklist
1. `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` in environment.
2. `DATABASE_URL` or default SQLite. For production, use PostgreSQL/Redis for Channels.
3. `GOOGLE_MAPS_API_KEY` for property geocoding.
4. All APIs are now versioned under `/api/v1/<app>/…` – update frontend clients accordingly.
5. Run `python manage.py makemigrations && python manage.py migrate`.
6. Seed roles/groups if needed `python manage.py init_roles`.
7. Create SocialApp entries in admin if using OAuth (`accounts/checks.py` warns if misconfigured).

### Useful Commands
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py init_roles
python manage.py check
```

### Testing
- `python manage.py test` runs the Django test suite (accounts/properties/communications tests live in each app).
- Run `python backend/manage.py check` before deployment to ensure system checks (including social auth) pass.

### Activation & Registration Notes
- By default the project currently auto-activates newly-registered users for a smoother developer experience. The registration endpoint is:
	- `POST /api/v1/accounts/auth/register/` — creates a user and (currently) sets `is_active=True`.
- The legacy/manual activation endpoint still exists and supports API clients:
	- `POST /api/v1/accounts/auth/<username>/activate/` with JSON `{ "code": "XXXX" }` will activate a user when codes are in use.

### Continuous Integration
- A GitHub Actions workflow was added at `.github/workflows/ci.yml` to run migrations and tests on push and pull requests to `master`.

### Running tests locally (recommended)
Create and activate a virtualenv, install requirements, then run migrations and tests:
```bash
cd /path/to/SmartDalali/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
python manage.py migrate
python manage.py test
```

If you see a test discovery ImportError referencing a `tests` module in a subpackage, run the individual app tests to avoid discovery conflicts:
```bash
python manage.py test accounts tests_permissions properties.tests_serializers
```

