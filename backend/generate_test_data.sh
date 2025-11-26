#!/bin/bash
# Helper script to run test data generator with virtual environment

cd "$(dirname "$0")"

echo "=== SmartDalali Test Data Generator ==="
echo ""

# Activate virtual environment
if [ -d "../.venv" ]; then
    source ../.venv/bin/activate
    echo "✓ Virtual environment activated"
elif [ -d "venv" ]; then
    source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "⚠ Warning: No virtual environment found"
    echo "  Trying to run anyway..."
fi

echo ""
echo "Running: python manage.py generate_test_data $@"
echo ""

# Run the command
python manage.py generate_test_data "$@"

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✓ Test data generated successfully!"
    echo ""
    echo "You can now:"
    echo "  - Login with any agent (e.g., john.mwangi1 / password123)"
    echo "  - Browse properties at /properties"
    echo "  - View agent profiles"
else
    echo ""
    echo "✗ Failed to generate test data (exit code: $exit_code)"
    echo "  Check the error messages above"
fi

exit $exit_code
