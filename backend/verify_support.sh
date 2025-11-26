#!/bin/bash
# Support System Backend Verification Script

echo "=== Support System Backend Verification ==="
echo ""

# Check if Django is running
echo "1. Checking if Django server is running..."
if curl -s http://localhost:8000/api/v1/ > /dev/null 2>&1; then
    echo "✅ Django server is running"
else
    echo "❌ Django server is NOT running"
    echo "   Start it with: cd backend && python3 manage.py runserver 0.0.0.0:8000"
    exit 1
fi

# Check migrations
echo ""
echo "2. Checking for pending migrations..."
cd backend
python3 manage.py showmigrations properties | grep "\[ \]" > /dev/null
if [ $? -eq 0 ]; then
    echo "❌ Pending migrations found"
    echo "   Run: python3 manage.py migrate"
else
    echo "✅ All migrations applied"
fi

# Test support endpoint
echo ""
echo "3. Testing support tickets endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/properties/support/tickets/)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
    echo "✅ Endpoint exists (returns $RESPONSE - auth required)"
elif [ "$RESPONSE" = "404" ]; then
    echo "❌ Endpoint returns 404 - URL routing issue"
else
    echo "⚠️  Endpoint returns $RESPONSE"
fi

# Check model exists
echo ""
echo "4. Checking if SupportTicket model exists..."
python3 manage.py shell -c "from properties.models import SupportTicket; print('✅ SupportTicket model exists')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ SupportTicket model not found"
fi

echo ""
echo "=== Verification Complete ==="
