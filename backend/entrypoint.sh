#!/bin/sh
set -e

# Run migrations then start dev server
python manage.py migrate --noinput

# Collect static optional - disabled for dev
# python manage.py collectstatic --noinput

# Start server
python manage.py runserver 0.0.0.0:8000
