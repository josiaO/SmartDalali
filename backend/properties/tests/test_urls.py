from django.urls import resolve, reverse

from properties import views


def test_property_urls():
    assert resolve(reverse("property-list-create")).func.view_class is views.PropertyListCreateView
    assert resolve(reverse("property-retrieve-update-destroy", args=[1])).func.view_class is views.PropertyRetrieveUpdateDestroyView


def test_visit_urls():
    assert resolve(reverse("propertyvisit-list-create")).func.view_class is views.PropertyVisitListCreateView
    assert resolve(reverse("propertyvisit-retrieve-update-destroy", args=[1])).func.view_class is views.PropertyVisitRetrieveUpdateDestroyView


def test_payment_urls():
    assert resolve(reverse("payment-list")).func.cls is views.PaymentViewSet
    assert resolve(reverse("payment-subscription")).func.cls is views.PaymentViewSet


def test_support_ticket_urls():
    assert resolve(reverse("support-ticket-list")).func.cls is views.SupportTicketViewSet
    assert resolve(reverse("support-ticket-reply", args=[1])).func.cls is views.SupportTicketViewSet


def test_function_urls():
    assert resolve(reverse("stk_push", args=[1])).func == views.stk_push
    assert resolve(reverse("mpesa_callback")).func == views.mpesa_callback
    assert resolve(reverse("payment_status", args=[1])).func == views.payment_status

