from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from properties.models import (
    AgentProfile,
    Features,
    MediaProperty,
    Payment,
    Property,
    PropertyVisit,
    SupportTicket,
    TicketReply,
)

pytestmark = pytest.mark.django_db


def test_agent_profile_str_returns_username(agent_user):
    profile = AgentProfile.objects.get(user=agent_user)
    assert str(profile) == agent_user.username


def test_property_str_and_lat_lng(property_obj):
    assert str(property_obj) == property_obj.title
    property_obj.latitude = 1.234
    property_obj.longitude = 5.678
    assert property_obj.get_lat_lng() == ("1.234", "5.678")
    property_obj.latitude = None
    property_obj.longitude = None
    assert property_obj.get_lat_lng() == (None, None)


def test_property_validation_requires_numeric_fields(property_data):
    property_data["rooms"] = None
    prop = Property(**property_data)
    with pytest.raises(ValidationError):
        prop.full_clean()


def test_media_property_relationship(property_obj, image_file):
    media = MediaProperty.objects.create(property=property_obj, Images=image_file)
    assert media.property == property_obj
    assert property_obj.MediaProperty.count() == 1


def test_features_relationship(property_obj):
    feature = Features.objects.create(property=property_obj, features="Pool")
    assert feature in property_obj.Features_Property.all()


def test_property_visit_default_status_and_ordering(property_obj, user):
    later = PropertyVisit.objects.create(
        property=property_obj,
        visitor=user,
        scheduled_time=timezone.now() + timedelta(days=2),
    )
    earlier = PropertyVisit.objects.create(
        property=property_obj,
        visitor=user,
        scheduled_time=timezone.now() + timedelta(days=1),
    )
    visits = list(PropertyVisit.objects.all())
    assert visits[0] == earlier
    assert visits[1] == later
    assert earlier.status == "pending"


def test_payment_str_representation(payment):
    text = str(payment)
    assert payment.method in text
    assert payment.status in text
    assert str(payment.amount) in text


def test_support_ticket_generates_ticket_number(user):
    ticket = SupportTicket.objects.create(
        user=user,
        title="Connectivity",
        description="Help",
        category="technical",
        priority="medium",
    )
    assert ticket.ticket_number.startswith("SD-")


def test_support_ticket_preserves_existing_ticket_number(user):
    ticket = SupportTicket.objects.create(
        ticket_number="SD-CUSTOM",
        user=user,
        title="Custom",
        description="Help",
        category="technical",
        priority="low",
    )
    ticket.save()
    assert ticket.ticket_number == "SD-CUSTOM"


def test_ticket_reply_str_contains_ticket_number(support_ticket, admin_user):
    reply = TicketReply.objects.create(
        ticket=support_ticket,
        user=admin_user,
        message="We are on it",
        is_admin_reply=True,
    )
    assert support_ticket.ticket_number in str(reply)

