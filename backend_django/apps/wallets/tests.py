import threading
from decimal import Decimal
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError, connections
from rest_framework.test import APIClient
from rest_framework import status

from apps.core.exceptions import AppException
from apps.wallets.models import (
    Wallet,
    WalletTransaction,
    Currency,
    TransactionDirection,
    TransactionType,
    TransactionStatus,
)
from apps.wallets.services import (
    get_or_create_wallet,
    credit_wallet,
    debit_wallet,
    InsufficientBalanceException,
    WalletNotFoundException,
)

User = get_user_model()


class WalletModelAndCreationTests(TestCase):
    """
    Tests for Wallet model creation, idempotency, constraints, and Decimal precision.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="wallet_user@example.com",
            name="Wallet User",
            password="SecurePassword123!",
        )

    def test_wallet_auto_creation_for_user(self):
        wallet = get_or_create_wallet(self.user)
        self.assertIsNotNone(wallet)
        self.assertEqual(wallet.user, self.user)
        self.assertEqual(wallet.gems, Decimal("0.00"))
        self.assertEqual(wallet.ves, 0)
        self.assertEqual(wallet.sves, 0)
        self.assertEqual(wallet.tokens, 0)
        self.assertEqual(wallet.spins, 0)

    def test_duplicate_wallet_creation_prevented(self):
        get_or_create_wallet(self.user)
        with self.assertRaises(IntegrityError):
            Wallet.objects.create(user=self.user)

    def test_get_or_create_wallet_is_idempotent(self):
        wallet1 = get_or_create_wallet(self.user)
        wallet2 = get_or_create_wallet(self.user)
        self.assertEqual(wallet1.id, wallet2.id)

    def test_gems_decimal_precision(self):
        wallet = get_or_create_wallet(self.user)
        wallet.gems = Decimal("1.00")
        wallet.save()
        wallet.refresh_from_db()
        self.assertEqual(wallet.gems, Decimal("1.00"))

        wallet.gems = Decimal("0.50")
        wallet.save()
        wallet.refresh_from_db()
        self.assertEqual(wallet.gems, Decimal("0.50"))


class WalletServiceTests(TestCase):
    """
    Tests for the server-authoritative wallet service layer:
    - Atomic credit and debit
    - Exact calculation of balance_before and balance_after
    - Ledger record immutability and accuracy
    - Insufficient balance enforcement
    - Unsupported currency and invalid amounts rejection
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="service_user@example.com",
            name="Service User",
            password="SecurePassword123!",
        )
        self.wallet = get_or_create_wallet(self.user)

    def test_credit_wallet_decimal_gem_values(self):
        # 1. Credit 1.00 GEM (correct CAPTCHA reward)
        wallet, txn1 = credit_wallet(
            user=self.user,
            currency=Currency.GEM,
            amount=Decimal("1.00"),
            type=TransactionType.CAPTCHA_REWARD,
            source="CAPTCHA",
            reference_id="CHALLENGE_CORRECT_1",
        )
        self.assertEqual(wallet.gems, Decimal("1.00"))
        self.assertEqual(txn1.balance_before, Decimal("0.00"))
        self.assertEqual(txn1.balance_after, Decimal("1.00"))
        self.assertEqual(txn1.amount, Decimal("1.00"))
        self.assertEqual(txn1.direction, TransactionDirection.CREDIT)
        self.assertEqual(txn1.type, TransactionType.CAPTCHA_REWARD)
        self.assertTrue(txn1.transaction_id.startswith("TXN_"))

        # 2. Credit 0.50 GEM (wrong CAPTCHA reward)
        wallet, txn2 = credit_wallet(
            user=self.user,
            currency=Currency.GEM,
            amount=Decimal("0.50"),
            type=TransactionType.CAPTCHA_REWARD,
            source="CAPTCHA",
            reference_id="CHALLENGE_WRONG_1",
        )
        self.assertEqual(wallet.gems, Decimal("1.50"))
        self.assertEqual(txn2.balance_before, Decimal("1.00"))
        self.assertEqual(txn2.balance_after, Decimal("1.50"))
        self.assertEqual(txn2.amount, Decimal("0.50"))

        # Confirm database state
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.50"))
        self.assertEqual(WalletTransaction.objects.filter(user=self.user).count(), 2)

    def test_credit_wallet_invalid_amount_rejected(self):
        with self.assertRaises(AppException) as ctx:
            credit_wallet(
                user=self.user,
                currency=Currency.GEM,
                amount=Decimal("0.00"),
                type=TransactionType.CAPTCHA_REWARD,
            )
        self.assertEqual(ctx.exception.code, "INVALID_AMOUNT")

        with self.assertRaises(AppException) as ctx:
            credit_wallet(
                user=self.user,
                currency=Currency.GEM,
                amount=Decimal("-1.00"),
                type=TransactionType.CAPTCHA_REWARD,
            )
        self.assertEqual(ctx.exception.code, "INVALID_AMOUNT")

    def test_credit_wallet_invalid_currency_rejected(self):
        with self.assertRaises(AppException) as ctx:
            credit_wallet(
                user=self.user,
                currency="BITCOIN",
                amount=Decimal("1.00"),
                type=TransactionType.CAPTCHA_REWARD,
            )
        self.assertEqual(ctx.exception.code, "INVALID_CURRENCY")

    def test_debit_wallet_success(self):
        # Initial credit of 5.00 GEM
        credit_wallet(
            user=self.user,
            currency=Currency.GEM,
            amount=Decimal("5.00"),
            type=TransactionType.ADMIN_CREDIT,
        )

        # Debit 2.00 GEM
        wallet, txn = debit_wallet(
            user=self.user,
            currency=Currency.GEM,
            amount=Decimal("2.00"),
            type=TransactionType.ADMIN_DEBIT,
            source="ADMIN",
            reference_id="DEBIT_REF_1",
        )
        self.assertEqual(wallet.gems, Decimal("3.00"))
        self.assertEqual(txn.balance_before, Decimal("5.00"))
        self.assertEqual(txn.balance_after, Decimal("3.00"))
        self.assertEqual(txn.amount, Decimal("2.00"))
        self.assertEqual(txn.direction, TransactionDirection.DEBIT)
        self.assertEqual(txn.status, TransactionStatus.COMPLETED)

    def test_debit_wallet_insufficient_balance(self):
        # Initial credit of 1.00 GEM
        credit_wallet(
            user=self.user,
            currency=Currency.GEM,
            amount=Decimal("1.00"),
            type=TransactionType.CAPTCHA_REWARD,
        )

        # Attempt to debit 2.00 GEM
        with self.assertRaises(InsufficientBalanceException):
            debit_wallet(
                user=self.user,
                currency=Currency.GEM,
                amount=Decimal("2.00"),
                type=TransactionType.ADMIN_DEBIT,
            )

        # Wallet balance should remain untouched
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.00"))

    def test_balance_before_and_after_server_authoritative(self):
        # Start at 0.00
        _, t1 = credit_wallet(self.user, Currency.GEM, Decimal("1.00"), TransactionType.REWARD)
        _, t2 = credit_wallet(self.user, Currency.GEM, Decimal("0.50"), TransactionType.REWARD)
        _, t3 = debit_wallet(self.user, Currency.GEM, Decimal("0.75"), TransactionType.ADMIN_DEBIT)

        self.assertEqual(t1.balance_before, Decimal("0.00"))
        self.assertEqual(t1.balance_after, Decimal("1.00"))

        self.assertEqual(t2.balance_before, Decimal("1.00"))
        self.assertEqual(t2.balance_after, Decimal("1.50"))

        self.assertEqual(t3.balance_before, Decimal("1.50"))
        self.assertEqual(t3.balance_after, Decimal("0.75"))

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("0.75"))


class WalletAPITests(TestCase):
    """
    Tests for Wallet API endpoints:
    - GET /api/wallet/
    - GET /api/wallet/summary/
    - GET /api/wallet/transactions/
    - User wallet isolation and parameter tampering prevention
    - Unauthorized access protection
    - Non-exposure of sensitive fields
    """

    def setUp(self):
        self.client = APIClient()

        # User A
        self.user_a = User.objects.create_user(
            email="usera@example.com",
            name="User A",
            password="UserAPassword123!",
        )
        self.wallet_a = get_or_create_wallet(self.user_a)
        credit_wallet(self.user_a, Currency.GEM, Decimal("10.00"), TransactionType.ADMIN_CREDIT)

        # User B
        self.user_b = User.objects.create_user(
            email="userb@example.com",
            name="User B",
            password="UserBPassword123!",
        )
        self.wallet_b = get_or_create_wallet(self.user_b)
        credit_wallet(self.user_b, Currency.GEM, Decimal("50.00"), TransactionType.ADMIN_CREDIT)

        # Get JWT for User A
        login_res = self.client.post(
            "/api/auth/login/",
            {"email": "usera@example.com", "password": "UserAPassword123!"},
            format="json",
        )
        self.token_a = login_res.json()["data"]["token"]

    def test_get_wallet_authenticated(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        response = self.client.get("/api/wallet/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data["success"])
        wallet_data = data["data"]["wallet"]
        self.assertEqual(wallet_data["gems"], "10.00")
        self.assertEqual(wallet_data["ves"], 0)

        # Sensitive data check
        self.assertNotIn("password", wallet_data)
        self.assertNotIn("password_hash", wallet_data)

    def test_user_wallet_isolation_against_parameter_tampering(self):
        """
        Ensure User A cannot view User B's wallet by tampering with query parameters.
        The user identity MUST strictly be derived from the authenticated JWT.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_a}")

        # Attempt to pass User B's ID via various query parameters
        tamper_params = [
            f"/api/wallet/?userId={self.user_b.id}",
            f"/api/wallet/?user_id={self.user_b.id}",
            f"/api/wallet/?walletId={self.wallet_b.id}",
            f"/api/wallet/?wallet_id={self.wallet_b.id}",
            f"/api/wallet/?targetUser={self.user_b.id}",
        ]

        for endpoint in tamper_params:
            res = self.client.get(endpoint)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            data = res.json()
            # Must ALWAYS return User A's wallet (10.00), NEVER User B's (50.00)
            self.assertEqual(
                data["data"]["wallet"]["gems"],
                "10.00",
                f"Isolation breach with endpoint: {endpoint}",
            )

    def test_wallet_transactions_user_isolation(self):
        """
        Ensure User A cannot retrieve User B's ledger transactions.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_a}")

        # User A requests transactions with User B's ID in query
        res = self.client.get(f"/api/wallet/transactions/?userId={self.user_b.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.json()
        txns = data["data"]["transactions"]
        self.assertEqual(len(txns), 1)
        # Transaction amount should be User A's (10.00), not User B's (50.00)
        self.assertEqual(txns[0]["amount"], "10.00")

    def test_wallet_summary_endpoint(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        res = self.client.get("/api/wallet/summary/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["gems"], "10.00")
        self.assertEqual(data["data"]["ves"], 0)

    def test_unauthorized_wallet_access_returns_401(self):
        endpoints = [
            "/api/wallet/",
            "/api/wallet/summary/",
            "/api/wallet/transactions/",
        ]
        for endpoint in endpoints:
            res = self.client.get(endpoint)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AUTHENTICATION_REQUIRED")


class WalletConcurrencyTests(TransactionTestCase):
    """
    Tests concurrent wallet mutations using PostgreSQL row-level locking (select_for_update).
    Uses TransactionTestCase to allow real database commits across distinct thread connections.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="concurrent_user@example.com",
            name="Concurrent User",
            password="SecurePassword123!",
        )
        self.wallet = get_or_create_wallet(self.user)

    def test_concurrent_credits_prevent_race_conditions(self):
        num_threads = 10
        credit_amount = Decimal("1.00")
        threads = []
        errors = []

        def worker():
            try:
                credit_wallet(
                    user=self.user,
                    currency=Currency.GEM,
                    amount=credit_amount,
                    type=TransactionType.CAPTCHA_REWARD,
                    source="CONCURRENCY_TEST",
                )
            except Exception as e:
                errors.append(e)
            finally:
                connections.close_all()

        for _ in range(num_threads):
            t = threading.Thread(target=worker)
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        self.assertEqual(errors, [], f"Thread errors occurred: {errors}")

        self.wallet.refresh_from_db()
        expected_balance = credit_amount * num_threads
        self.assertEqual(
            self.wallet.gems,
            expected_balance,
            f"Expected {expected_balance} Gems after {num_threads} concurrent credits, got {self.wallet.gems}",
        )

        # Verify all transactions are recorded in the ledger
        tx_count = WalletTransaction.objects.filter(
            user=self.user,
            source="CONCURRENCY_TEST",
        ).count()
        self.assertEqual(tx_count, num_threads)
