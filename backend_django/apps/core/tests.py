from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import UserRole, AccountStatus
from apps.core.exceptions import AppException

User = get_user_model()


class UserModelTests(TestCase):
    """Unit tests for the custom User model."""

    def test_create_user_successful(self):
        user = User.objects.create_user(
            email="TEST@Example.com",
            name="Test User",
            password="test-password-123",
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.name, "Test User")
        self.assertEqual(user.role, UserRole.USER)
        self.assertEqual(user.account_status, AccountStatus.ACTIVE)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password("test-password-123"))

    def test_create_user_missing_email_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", name="Test", password="password")

    def test_create_user_missing_name_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="test@example.com", name="", password="password")

    def test_create_superuser_successful(self):
        admin = User.objects.create_superuser(
            email="admin@veloop.test",
            name="Admin User",
            password="admin-password-123",
        )
        self.assertEqual(admin.role, UserRole.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_admin)


class HealthCheckAPITests(TestCase):
    """Test suite for public healthcheck probe."""

    def setUp(self):
        self.client = APIClient()

    def test_healthcheck_returns_200_and_expected_payload(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("message"), "VELoop Rewards backend is running")


class ExceptionHandlerTests(TestCase):
    """Test standard exception formatting."""

    def test_app_exception_envelope(self):
        from rest_framework.views import APIView
        from apps.core.exceptions import BadRequestException

        class MockErrorView(APIView):
            permission_classes = []

            def get(self, request):
                raise BadRequestException(message="Custom bad request", code="CUSTOM_CODE")

        client = APIClient()
        # Test directly via the exception handler
        from apps.core.exceptions import standardized_exception_handler
        exc = BadRequestException(message="Custom bad request", code="CUSTOM_CODE")
        response = standardized_exception_handler(exc, {"request": None})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["error"]["code"], "CUSTOM_CODE")
        self.assertEqual(response.data["error"]["message"], "Custom bad request")
