from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import AccountStatus
from apps.wallets.models import Wallet

User = get_user_model()


class AuthenticationAPITests(TestCase):
    """
    Test suite for Authentication endpoints:
    - User registration + automatic wallet creation
    - Login with active account verification
    - JWT authentication
    - Token refresh
    - /me profile lookup
    - Password hash non-exposure
    """

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.me_url = "/api/auth/me/"
        self.refresh_url = "/api/auth/token/refresh/"

    def test_user_registration_creates_user_and_wallet_successfully(self):
        payload = {
            "email": "alice@example.com",
            "name": "Alice Smith",
            "password": "SecurePassword123!",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertTrue(data["success"])
        user_data = data["data"]["user"]
        self.assertEqual(user_data["email"], "alice@example.com")
        self.assertEqual(user_data["name"], "Alice Smith")
        self.assertEqual(user_data["role"], "USER")
        self.assertEqual(user_data["accountStatus"], "ACTIVE")

        # Verify JWT tokens returned
        self.assertIn("token", data["data"])
        self.assertIn("refreshToken", data["data"])
        self.assertTrue(len(data["data"]["token"]) > 20)

        # Verify password hash is NOT exposed
        self.assertNotIn("password", user_data)
        self.assertNotIn("passwordHash", user_data)

        # Verify wallet was automatically created
        user = User.objects.get(email="alice@example.com")
        self.assertTrue(hasattr(user, "wallet"))
        self.assertEqual(user.wallet.gems, 0)
        self.assertEqual(user.wallet.ves, 0)

        # Verify duplicate wallet cannot be created
        with self.assertRaises(Exception):
            Wallet.objects.create(user=user)

    def test_registration_duplicate_email_rejected(self):
        User.objects.create_user(
            email="existing@example.com",
            name="Existing User",
            password="Password123!",
        )

        payload = {
            "email": "Existing@Example.com",
            "name": "Another User",
            "password": "Password123!",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "EMAIL_ALREADY_REGISTERED")

    def test_registration_invalid_data_rejected(self):
        # Short password (<8)
        response = self.client.post(
            self.register_url,
            {"email": "short@example.com", "name": "Short", "password": "short"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        user = User.objects.create_user(
            email="bob@example.com",
            name="Bob Jones",
            password="BobPassword123!",
        )

        response = self.client.post(
            self.login_url,
            {"email": "bob@example.com", "password": "BobPassword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["user"]["email"], "bob@example.com")
        self.assertIn("token", data["data"])
        self.assertIn("refreshToken", data["data"])

        # Check last_login was updated
        user.refresh_from_db()
        self.assertIsNotNone(user.last_login)

    def test_login_invalid_password(self):
        User.objects.create_user(
            email="carol@example.com",
            name="Carol",
            password="CarolPassword123!",
        )

        response = self.client.post(
            self.login_url,
            {"email": "carol@example.com", "password": "WrongPassword!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "INVALID_CREDENTIALS")

    def test_login_inactive_account_forbidden(self):
        User.objects.create_user(
            email="blocked@example.com",
            name="Blocked User",
            password="BlockedPassword123!",
            account_status=AccountStatus.BLOCKED,
        )

        response = self.client.post(
            self.login_url,
            {"email": "blocked@example.com", "password": "BlockedPassword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "ACCOUNT_NOT_ACTIVE")

    def test_token_refresh_successful(self):
        user = User.objects.create_user(
            email="tokenuser@example.com",
            name="Token User",
            password="Password123!",
        )
        login_res = self.client.post(
            self.login_url,
            {"email": "tokenuser@example.com", "password": "Password123!"},
            format="json",
        )
        refresh_token = login_res.json()["data"]["refreshToken"]

        refresh_res = self.client.post(
            self.refresh_url,
            {"refreshToken": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        data = refresh_res.json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])

    def test_me_authenticated(self):
        user = User.objects.create_user(
            email="meuser@example.com",
            name="Me User",
            password="Password123!",
        )
        login_res = self.client.post(
            self.login_url,
            {"email": "meuser@example.com", "password": "Password123!"},
            format="json",
        )
        token = login_res.json()["data"]["token"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["user"]["email"], "meuser@example.com")
        self.assertNotIn("password", data["data"]["user"])

    def test_me_unauthorized(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "AUTHENTICATION_REQUIRED")
