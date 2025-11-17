import pytest
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser

from accounts.permissions import IsAdmin, IsAgent

pytestmark = pytest.mark.django_db


def test_is_admin_allows_only_superuser(admin_user, user):
    factory = APIRequestFactory()
    request = factory.get("/")
    request.user = admin_user
    assert IsAdmin().has_permission(request, None)

    request.user = user
    assert not IsAdmin().has_permission(request, None)

    request.user = AnonymousUser()
    assert not IsAdmin().has_permission(request, None)


def test_is_agent_requires_group(agent_user, user):
    factory = APIRequestFactory()
    request = factory.get("/")
    request.user = agent_user
    assert IsAgent().has_permission(request, None)

    request.user = user
    assert not IsAgent().has_permission(request, None)

