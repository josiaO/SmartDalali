from types import SimpleNamespace

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from properties.models import PropertyFeature, MediaProperty, TicketReply
from properties.serializers import (
    CreateSupportTicketSerializer,
    PaymentSerializer,
    PropertyVisitSerializer,
    SerializerProperty,
    SubscriptionPaymentSerializer,
    SupportTicketSerializer,
    TicketReplySerializer,
)

pytestmark = pytest.mark.django_db

DUMMY_IMAGE_DATA = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\x08\n\n\t\x0b\x0c\x0c\x0b\x0b\x0c\x12\x11\x10\x13\x18\x18\x17\x16\x18\x11\x13\x17\x1d\x1c\x1b\x1e\x1b\x16\x16\x1d\x1f\x1f\x1f\x12\x15\x18\x1b\x19\x1a\x1a\x1a\x18\x15\x15\x17\x19\x1d\x1b\x1c\x1b\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\x1f\x01\x00\x03\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xa7\x00\xff\xd9'


def test_property_serializer_includes_agent_nested_and_maps(monkeypatch, property_obj):
    PropertyFeature.objects.create(property=property_obj, features="Pool")
    MediaProperty.objects.create(
        property=property_obj,
        Images=SimpleUploadedFile("main.jpeg", DUMMY_IMAGE_DATA, content_type="image/jpeg"),
    )
    property_obj.latitude = 1.23
    property_obj.longitude = 4.56
    monkeypatch.setattr(
        "properties.serializers.build_maps_url",
        lambda lat, lng: f"https://maps.test/{lat},{lng}",
    )

    serializer = SerializerProperty(property_obj, context={"request": None})
    data = serializer.data
    assert data["agent"]["username"] == property_obj.owner.username
    assert data["property_features"][0]["features"] == "Pool"
    assert data["MediaProperty"][0]["id"] is not None
    assert data["address"] == property_obj.adress
    assert data["maps_url"] == "https://maps.test/1.23,4.56"


@pytest.mark.skip(reason="ImageField validation needs a proper image setup")
def test_property_serializer_create_handles_nested_relationships(agent_user, monkeypatch):
    monkeypatch.setattr(SerializerProperty, "_sync_coordinates", lambda *args, **kwargs: None)
    payload = {
        "title": "New Listing",
        "description": "Desc",
        "price": "500.00",
        "type": "House",
        "area": 80,
        "rooms": 4,
        "bedrooms": 2,
        "bathrooms": 2,
        "city": "Nairobi",
        "adress": "7th Street",
        "MediaProperty": [{"Images": SimpleUploadedFile("img.jpg", DUMMY_IMAGE_DATA, content_type="image/jpeg")}],
        "property_features": [{"features": "Garden"}],
    }

    serializer = SerializerProperty(data=payload, context={"request": None})
    assert serializer.is_valid(), serializer.errors
    instance = serializer.save(owner=agent_user)
    assert instance.MediaProperty.count() == 1
    assert list(instance.property_features.values_list("features", flat=True)) == ["Garden"]
    assert instance.owner == agent_user


@pytest.mark.skip(reason="ImageField validation needs a proper image setup")
def test_property_serializer_update_replaces_nested_and_preserves_owner(
    property_obj, user, django_user_model, monkeypatch
):
    PropertyFeature.objects.create(property=property_obj, features="Old")
    MediaProperty.objects.create(
        property=property_obj,
        Images=SimpleUploadedFile("old.jpg", DUMMY_IMAGE_DATA, content_type="image/jpeg"),
    )
    other_user = django_user_model.objects.create_user(username="intruder")
    monkeypatch.setattr(SerializerProperty, "_sync_coordinates", lambda *args, **kwargs: None)

    payload = {
        "title": "Updated",
        "owner": other_user.id,
        "property_features": [{"features": "New"}],
        "MediaProperty": [{"Images": SimpleUploadedFile("new.jpg", DUMMY_IMAGE_DATA, content_type="image/jpeg")}],
    }
    serializer = SerializerProperty(
        property_obj,
        data=payload,
        partial=True,
        context={"request": None},
    )
    assert serializer.is_valid(), serializer.errors
    serializer.save()
    property_obj.refresh_from_db()
    assert list(property_obj.property_features.values_list("features", flat=True)) == ["New"]
    assert property_obj.MediaProperty.count() == 1
    assert property_obj.owner != other_user


def test_property_serializer_sync_coordinates(monkeypatch, property_obj):
    def fake_geocode(address, city):
        return {"lat": 1.11, "lng": 2.22, "place_id": "place123"}

    monkeypatch.setattr("properties.serializers.geocode_address", fake_geocode)
    serializer = SerializerProperty(property_obj, context={"request": None})
    serializer._sync_coordinates(property_obj, {"adress": "Main", "city": "Nairobi"})
    property_obj.refresh_from_db()
    assert float(property_obj.latitude) == 1.11
    assert float(property_obj.longitude) == 2.22
    assert property_obj.google_place_id == "place123"


def test_property_visit_serializer(property_visit):
    serializer = PropertyVisitSerializer(property_visit)
    assert serializer.data["visitor"] == property_visit.visitor.id
    assert serializer.data["status"] == property_visit.status


def test_payment_serializer_returns_fields(payment):
    serializer = PaymentSerializer(payment)
    assert serializer.data["method"] == payment.method
    assert serializer.data["transaction_id"] == payment.transaction_id


def test_subscription_payment_serializer_validates_choice():
    serializer = SubscriptionPaymentSerializer(data={"plan": "weekly", "phone": "2547"})
    assert not serializer.is_valid()
    assert "plan" in serializer.errors


def test_support_ticket_serializer_counts_replies(support_ticket, admin_user):
    TicketReply.objects.create(
        ticket=support_ticket,
        user=admin_user,
        message="We will help",
        is_admin_reply=True,
    )
    serializer = SupportTicketSerializer(support_ticket)
    assert serializer.data["reply_count"] == 1
    assert serializer.data["user_name"] == support_ticket.user.username


def test_create_support_ticket_serializer_sets_user(user):
    request = SimpleNamespace(user=user)
    serializer = CreateSupportTicketSerializer(
        data={
            "title": "Need assistance",
            "description": "Details",
            "category": "technical",
            "priority": "high",
        },
        context={"request": request},
    )
    assert serializer.is_valid(), serializer.errors
    ticket = serializer.save()
    assert ticket.user == user


def test_ticket_reply_serializer_role_detection(agent_user, support_ticket):
    reply = TicketReply.objects.create(
        ticket=support_ticket,
        user=agent_user,
        message="Checking in",
        is_admin_reply=False,
    )
    serializer = TicketReplySerializer(reply)
    assert serializer.data["user_role"] == "agent"