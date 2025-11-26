from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from properties.models import Payment, PropertyVisit, SupportTicket
from properties.serializers import SerializerProperty

pytestmark = pytest.mark.django_db


def test_property_list_returns_properties(api_client, property_obj):
    url = reverse("property-list-create")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert any(item["title"] == property_obj.title for item in response.data['results'])


def test_property_create_assigns_owner(agent_client, agent_user, property_payload, monkeypatch):
    monkeypatch.setattr(SerializerProperty, "_sync_coordinates", lambda *args, **kwargs: None)
    url = reverse("property-list-create")
    response = agent_client.post(url, property_payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["owner"] == agent_user.id


def test_property_update_allows_partial(agent_client, property_obj, monkeypatch):
    monkeypatch.setattr(SerializerProperty, "_sync_coordinates", lambda *args, **kwargs: None)
    url = reverse("property-retrieve-update-destroy", args=[property_obj.id])
    response = agent_client.patch(url, {"title": "Updated Title"}, format="json")
    property_obj.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert property_obj.title == "Updated Title"


def test_property_delete_by_owner_succeeds(agent_client, agent_user, property_obj):
    property_obj.owner = agent_user
    property_obj.save()
    url = reverse("property-retrieve-update-destroy", args=[property_obj.id])
    response = agent_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT


def test_property_visit_requires_authentication(api_client, property_obj, user):
    url = reverse("propertyvisit-list-create")
    payload = {
        "property": property_obj.id,
        "visitor": user.id,
        "scheduled_time": (timezone.now() + timedelta(days=1)).isoformat(),
    }
    response = api_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_property_visit_create_authenticated(auth_client, property_obj, user):
    url = reverse("propertyvisit-list-create")
    payload = {
        "property": property_obj.id,
        "visitor": user.id,
        "scheduled_time": (timezone.now() + timedelta(days=2)).isoformat(),
        "status": "confirmed",
    }
    response = auth_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert PropertyVisit.objects.filter(visitor=user, property=property_obj).exists()


def test_payment_list_regular_user_sees_only_their_records(
    auth_client, payment, django_user_model, property_obj
):
    other_user = django_user_model.objects.create_user(username="other", email="other@example.com")
    Payment.objects.create(
        user=other_user,
        property=property_obj,
        method="stripe",
        amount="2000.00",
        status="completed",
        transaction_id="T999",
    )
    url = reverse("payment-list")
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["user"]["id"] == payment.user.id


def test_payment_list_admin_sees_all_records(admin_client, payment, django_user_model, property_obj):
    extra_user = django_user_model.objects.create_user(username="extra", email="extra@example.com")
    Payment.objects.create(
        user=extra_user,
        property=property_obj,
        method="mpesa",
        amount="800.00",
        status="pending",
        transaction_id="T500",
    )
    url = reverse("payment-list")
    response = admin_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 2


def test_payment_subscription_returns_plan_details(auth_client):
    url = reverse("payment-subscription")
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert {"monthly", "annual"} <= set(response.data.keys())


def test_payment_admin_list_requires_superuser(admin_client, auth_client, payment):
    url = reverse("payment-admin-list")
    assert admin_client.get(url).status_code == status.HTTP_200_OK
    assert auth_client.get(url).status_code == status.HTTP_403_FORBIDDEN


def test_payment_retry_sets_cancelled_to_pending(admin_client, payment):
    payment.status = "cancelled"
    payment.save()
    url = reverse("payment-retry", args=[payment.id])
    response = admin_client.post(url)
    payment.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert payment.status == "pending"


def test_payment_retry_rejects_non_cancelled(admin_client, payment):
    url = reverse("payment-retry", args=[payment.id])
    response = admin_client.post(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.skip(reason="M-Pesa API credentials not available in test environment")
def test_stk_push_creates_payment_record(
    auth_client, user, property_obj, mpesa_settings, mpesa_stub
):
    url = reverse("stk_push", args=[property_obj.id])
    payload = {"phone": "254700000000", "amount": "1500"}
    response = auth_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_200_OK
    payment = Payment.objects.get(user=user)
    assert payment.method == "mpesa"
    assert payment.status == "pending"


@pytest.mark.skip(reason="M-Pesa API credentials not available in test environment")
def test_stk_push_rejects_invalid_amount(auth_client, property_obj, mpesa_settings, mpesa_stub):
    url = reverse("stk_push", args=[property_obj.id])
    payload = {"phone": "254700000000", "amount": "-1"}
    response = auth_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.skip(reason="M-Pesa API credentials not available in test environment")
def test_mpesa_callback_updates_payment_and_agent_subscription(
    client, sample_callback_payload, payment, agent_user
):
    url = reverse("mpesa_callback")
    response = client.post(url, data=sample_callback_payload, content_type="application/json")
    payment.refresh_from_db()
    agent_profile = agent_user.agentprofile
    assert response.status_code == status.HTTP_200_OK
    assert payment.status == "completed"
    assert agent_profile.subscription_active is True
    assert agent_profile.subscription_expires is not None


def test_payment_status_allows_owner(client, payment):
    client.force_login(payment.user)
    url = reverse("payment_status", args=[payment.id])
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == payment.status


def test_payment_status_blocks_other_users(client, payment, django_user_model):
    stranger = django_user_model.objects.create_user(username="outsider", email="out@example.com")
    client.force_login(stranger)
    url = reverse("payment_status", args=[payment.id])
    response = client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_support_ticket_list_shows_only_user_entries(
    auth_client, support_ticket, django_user_model
):
    other = django_user_model.objects.create_user(username="alt", email="alt@example.com")
    SupportTicket.objects.create(
        ticket_number="SD-ALT",
        user=other,
        title="Other issue",
        description="desc",
        category="technical",
        priority="low",
    )
    url = reverse("support-ticket-list")
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 1


def test_support_ticket_create_sets_authenticated_user(auth_client, user):
    url = reverse("support-ticket-list")
    payload = {
        "title": "Payment issue",
        "description": "Card declined",
        "category": "payment",
        "priority": "high",
    }
    response = auth_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert SupportTicket.objects.filter(title="Payment issue", user=user).exists()


def test_support_ticket_reply_user_reopens_ticket(auth_client, support_ticket):
    support_ticket.status = "resolved"
    support_ticket.save()
    url = reverse("support-ticket-reply", args=[support_ticket.id])
    response = auth_client.post(url, {"message": "Still broken"}, format="json")
    support_ticket.refresh_from_db()
    assert response.status_code == status.HTTP_201_CREATED
    assert support_ticket.status == "open"
    assert support_ticket.user_reply == "Still broken"


def test_support_ticket_reply_admin_assigns_and_updates(admin_client, support_ticket, admin_user):
    url = reverse("support-ticket-reply", args=[support_ticket.id])
    response = admin_client.post(url, {"message": "Investigating"}, format="json")
    support_ticket.refresh_from_db()
    assert response.status_code == status.HTTP_201_CREATED
    assert support_ticket.admin_reply == "Investigating"
    assert support_ticket.assigned_to == admin_user
    assert support_ticket.status == "in_progress"


def test_support_ticket_reply_requires_message(auth_client, support_ticket):
    url = reverse("support-ticket-reply", args=[support_ticket.id])
    response = auth_client.post(url, {}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_support_ticket_assign_requires_staff(
    auth_client, staff_client, staff_user, support_ticket
):
    url = reverse("support-ticket-assign", args=[support_ticket.id])
    assert auth_client.post(url, {"assigned_to": staff_user.id}, format="json").status_code == status.HTTP_403_FORBIDDEN
    response = staff_client.post(url, {"assigned_to": staff_user.id}, format="json")
    support_ticket.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert support_ticket.assigned_to == staff_user
    assert support_ticket.status == "in_progress"


def test_support_ticket_close_sets_closed_at(staff_client, support_ticket):
    url = reverse("support-ticket-close", args=[support_ticket.id])
    response = staff_client.post(url)
    support_ticket.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert support_ticket.status == "closed"
    assert support_ticket.closed_at is not None


def test_support_ticket_stats_requires_staff(staff_client, auth_client, support_ticket):
    url = reverse("support-ticket-stats")
    assert staff_client.get(url).status_code == status.HTTP_200_OK
    assert auth_client.get(url).status_code == status.HTTP_403_FORBIDDEN