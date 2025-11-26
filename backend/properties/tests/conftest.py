import json
import sys
import types
from datetime import timedelta

import pytest
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Profile
from properties.models import (
    AgentProfile,
    Payment,
    Property,
    PropertyVisit,
    SupportTicket,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def password():
    return "Str0ngPass!"


@pytest.fixture
def user(django_user_model, password):
    instance = django_user_model.objects.create_user(
        username="regular",
        email="user@example.com",
        password=password,
    )
    Profile.objects.get_or_create(user=instance)
    return instance


@pytest.fixture
def agent_user(django_user_model, password):
    agent = django_user_model.objects.create_user(
        username="agent",
        email="agent@example.com",
        password=password,
    )
    Profile.objects.get_or_create(user=agent)
    group, _ = Group.objects.get_or_create(name="agent")
    agent.groups.add(group)
    AgentProfile.objects.get_or_create(user=agent, profile=agent.profile)
    return agent


@pytest.fixture
def admin_user(django_user_model, password):
    admin = django_user_model.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password=password,
    )
    Profile.objects.get_or_create(user=admin)
    return admin


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def agent_client(agent_user):
    client = APIClient()
    client.force_authenticate(user=agent_user)
    return client


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def staff_user(django_user_model, password):
    staff = django_user_model.objects.create_user(
        username="staff",
        email="staff@example.com",
        password=password,
        is_staff=True,
    )
    Profile.objects.get_or_create(user=staff)
    return staff


@pytest.fixture
def staff_client(staff_user):
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.fixture
def image_file():
    return SimpleUploadedFile("test.jpg", b"filecontent", content_type="image/jpeg")





@pytest.fixture
def property_data(agent_user):
    return {
        "owner": agent_user,
        "title": "Loft Apartment",
        "description": "Spacious loft downtown",
        "price": "150000.00",
        "type": "Apartment",
        "area": 120.5,
        "rooms": 5,
        "bedrooms": 3,
        "bathrooms": 2,
        "status": "active",
        "parking": True,
        "year_built": timezone.now(),
        "city": "Nairobi",
        "adress": "Kijabe Street",
        "latitude": None,
        "longitude": None,
    }


@pytest.fixture
def property_obj(property_data):
    return Property.objects.create(**property_data)


@pytest.fixture
def property_payload():
    return {
        "title": "Brand New Listing",
        "description": "Detailed listing info",
        "price": "700000.00",
        "type": "House",
        "area": 200,
        "rooms": 6,
        "bedrooms": 4,
        "bathrooms": 3,
        "city": "Nairobi",
        "adress": "Kijabe Street",
    }


@pytest.fixture
def property_visit(property_obj, user):
    return PropertyVisit.objects.create(
        property=property_obj,
        visitor=user,
        scheduled_time=timezone.now() + timedelta(days=1),
        status="pending",
    )


@pytest.fixture
def payment(property_obj, user):
    return Payment.objects.create(
        user=user,
        property=property_obj,
        method="mpesa",
        amount="1000.00",
        status="pending",
        transaction_id="T123",
        raw_payload={"foo": "bar"},
    )


@pytest.fixture
def support_ticket(user):
    return SupportTicket.objects.create(
        ticket_number="SD-0001",
        user=user,
        title="Need help",
        description="Details",
        category="technical",
        priority="medium",
    )


@pytest.fixture
def sample_callback_payload(payment):
    return json.dumps(
        {
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": payment.transaction_id,
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 1.0},
                            {"Name": "MpesaReceiptNumber", "Value": "QWERTY"},
                            {"Name": "TransactionDate", "Value": 20220101120000}
                        ]
                    }
                }
            }
        }
    )


@pytest.fixture
def mpesa_settings(settings):
    settings.DAR_AFFILIATE_CONSUMER_KEY = "key"
    settings.DAR_AFFILIATE_CONSUMER_SECRET = "secret"
    settings.DAR_SHORTCODE = "600000"
    settings.DAR_PASSKEY = "passkey"
    return settings


@pytest.fixture
def mpesa_stub(monkeypatch):
    """Install a lightweight MpesaClient stub so stk_push can run without the real SDK."""

    class DummyClient:
        def __init__(self, *_, **__):
            pass

        def stk_push(self, **kwargs):
            return {"ResponseCode": "0", "MerchantRequestID": "XYZ", **kwargs}

    core_module = types.ModuleType("django_daraja.mpesa.core")
    core_module.MpesaClient = DummyClient

    mpesa_module = types.ModuleType("django_daraja.mpesa")
    mpesa_module.core = core_module

    root_module = types.ModuleType("django_daraja")
    root_module.mpesa = mpesa_module

    monkeypatch.setitem(sys.modules, "django_daraja", root_module)
    monkeypatch.setitem(sys.modules, "django_daraja.mpesa", mpesa_module)
    monkeypatch.setitem(sys.modules, "django_daraja.mpesa.core", core_module)
    return DummyClient

