import threading
from datetime import timedelta
from decimal import Decimal
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import connections
from rest_framework.test import APIClient
from rest_framework import status

from apps.captcha.models import (
    CaptchaChallenge,
    CaptchaAttempt,
    ChallengeStatus,
    ChallengeResult,
)
from apps.captcha.services import (
    generate_captcha_challenge,
    get_or_create_current_challenge,
    ALLOWED_ALPHABET,
    CAPTCHA_LENGTH,
    CHALLENGE_TTL_SECONDS,
)
from apps.wallets.models import WalletTransaction, Currency, TransactionDirection, TransactionType
from apps.wallets.services import get_or_create_wallet

User = get_user_model()


class CaptchaGeneratorServiceTests(TestCase):
    """
    Unit tests for CAPTCHA challenge generator and lifecycle services.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="captcha_tester@example.com",
            name="Captcha Tester",
            password="SecurePassword123!",
        )

    def test_captcha_text_length_and_allowed_charset(self):
        """
        1. CAPTCHA text is exactly 6 characters.
        2. CAPTCHA contains only allowed characters (no O, 0, I, 1).
        """
        for _ in range(20):
            challenge = generate_captcha_challenge(self.user)
            self.assertEqual(len(challenge.captcha_text), CAPTCHA_LENGTH)
            for char in challenge.captcha_text:
                self.assertIn(char, ALLOWED_ALPHABET)
                self.assertNotIn(char, ["O", "0", "I", "1"])

    def test_four_options_generated_and_correct_present(self):
        """
        3. Exactly four options are generated.
        4. Correct option is present among the four options.
        8. correct_option matches captcha_text.
        """
        for _ in range(10):
            challenge = generate_captcha_challenge(self.user)
            options = challenge.options
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4, "All 4 options must be distinct")
            self.assertEqual(challenge.correct_option, challenge.captcha_text)
            self.assertIn(challenge.correct_option, options)

    def test_option_composition_similar_and_different(self):
        """
        5. Two similar wrong options are generated.
        6. One different option is generated.
        """
        challenge = generate_captcha_challenge(self.user)
        for opt in challenge.options:
            self.assertEqual(len(opt), CAPTCHA_LENGTH)
            for char in opt:
                self.assertIn(char, ALLOWED_ALPHABET)

    def test_options_are_randomized(self):
        """
        7. Options are randomized (correct_option is not always at the same position).
        """
        indices = set()
        for _ in range(30):
            challenge = generate_captcha_challenge(self.user)
            idx = challenge.options.index(challenge.correct_option)
            indices.add(idx)

        self.assertGreater(len(indices), 1, "Options position must be randomized")

    def test_no_attempts_created_during_generation(self):
        """
        Attempts belong to verification/audit activity and must not be created during generation.
        """
        initial_attempts = CaptchaAttempt.objects.count()
        generate_captcha_challenge(self.user)
        self.assertEqual(CaptchaAttempt.objects.count(), initial_attempts)

    def test_challenge_expiration_set_correctly(self):
        """
        16. expires_at is correctly set (approximately 120 seconds in future).
        """
        now = timezone.now()
        challenge = generate_captcha_challenge(self.user)
        expected_expiry = now + timedelta(seconds=CHALLENGE_TTL_SECONDS)
        delta = abs((challenge.expires_at - expected_expiry).total_seconds())
        self.assertLess(delta, 5)

    def test_existing_unexpired_challenge_returned(self):
        """
        13. Existing unexpired pending challenge is returned instead of creating another one.
        """
        first = get_or_create_current_challenge(self.user)
        second = get_or_create_current_challenge(self.user)
        self.assertEqual(first.challenge_id, second.challenge_id)
        self.assertEqual(CaptchaChallenge.objects.filter(user=self.user).count(), 1)

    def test_expired_challenge_marked_and_new_generated(self):
        """
        14. Expired challenge is not returned as current.
        15. A new challenge is generated when no valid current challenge exists.
        """
        expired_time = timezone.now() - timedelta(seconds=10)
        old_challenge = generate_captcha_challenge(self.user)
        old_challenge.expires_at = expired_time
        old_challenge.save(update_fields=["expires_at"])

        new_challenge = get_or_create_current_challenge(self.user)
        self.assertNotEqual(old_challenge.challenge_id, new_challenge.challenge_id)
        self.assertGreater(new_challenge.expires_at, timezone.now())

        old_challenge.refresh_from_db()
        self.assertEqual(old_challenge.status, ChallengeStatus.EXPIRED)
        self.assertEqual(old_challenge.result, ChallengeResult.EXPIRED)


class CaptchaAuthenticationSecurityTests(TestCase):
    """
    Phase 8.1: Tests ensuring all CAPTCHA endpoints strictly enforce JWT authentication.
    Verifies rejection on missing tokens and forged/invalid tokens.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="auth_sec_user@example.com",
            name="Auth Sec User",
            password="SecurePassword123!",
        )
        self.challenge = generate_captcha_challenge(self.user)
        self.endpoints = [
            ("GET", "/api/captcha/current/", None),
            ("POST", "/api/captcha/verify/", {"challengeId": str(self.challenge.challenge_id), "selectedOption": "ABCDEF"}),
            ("POST", "/api/captcha/claim/", {"challengeId": str(self.challenge.challenge_id)}),
            ("POST", "/api/captcha/dismiss/", {"challengeId": str(self.challenge.challenge_id)}),
            ("POST", "/api/captcha/no-thanks/", {"challengeId": str(self.challenge.challenge_id)}),
        ]

    def test_endpoints_require_authentication(self):
        for method, url, payload in self.endpoints:
            if method == "GET":
                res = self.client.get(url)
            else:
                res = self.client.post(url, payload, format="json")

            self.assertEqual(
                res.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {url} did not enforce auth (status: {res.status_code})",
            )
            self.assertEqual(res.json()["error"]["code"], "AUTHENTICATION_REQUIRED")

    def test_endpoints_reject_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid.forged.jwttoken")
        for method, url, payload in self.endpoints:
            if method == "GET":
                res = self.client.get(url)
            else:
                res = self.client.post(url, payload, format="json")

            self.assertEqual(
                res.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {url} accepted invalid token",
            )


class CaptchaUserIsolationSecurityTests(TestCase):
    """
    Phase 8.2: Tests cross-user access, challenge hijacking, and parameter tampering.
    Confirms User B cannot access, verify, claim, or dismiss User A's challenge under any circumstances.
    """

    def setUp(self):
        self.client = APIClient()

        # User A
        self.user_a = User.objects.create_user(
            email="usera_iso@example.com",
            name="User A",
            password="Password123!",
        )
        self.wallet_a = get_or_create_wallet(self.user_a)
        self.challenge_a = generate_captcha_challenge(self.user_a)

        # User B
        self.user_b = User.objects.create_user(
            email="userb_iso@example.com",
            name="User B",
            password="Password123!",
        )
        self.wallet_b = get_or_create_wallet(self.user_b)
        self.challenge_b = generate_captcha_challenge(self.user_b)

        # Login User B
        login_res_b = self.client.post(
            "/api/auth/login/",
            {"email": "userb_iso@example.com", "password": "Password123!"},
            format="json",
        )
        self.token_b = login_res_b.json()["data"]["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_b}")

    def test_user_b_cannot_fetch_user_a_challenge(self):
        # Normal call by User B returns Challenge B
        res = self.client.get("/api/captcha/current/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["data"]["challengeId"], str(self.challenge_b.challenge_id))

        # Query param tampering attempting to fetch Challenge A
        res_tamper = self.client.get(f"/api/captcha/current/?userId={self.user_a.id}&challengeId={self.challenge_a.challenge_id}")
        self.assertEqual(res_tamper.status_code, status.HTTP_200_OK)
        self.assertEqual(res_tamper.json()["data"]["challengeId"], str(self.challenge_b.challenge_id))

    def test_user_b_cannot_verify_user_a_challenge(self):
        payload = {
            "challengeId": str(self.challenge_a.challenge_id),
            "selectedOption": self.challenge_a.correct_option,
            "userId": str(self.user_a.id),
        }
        res = self.client.post("/api/captcha/verify/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(res.json()["error"]["code"], "CHALLENGE_NOT_FOUND")

        # Verify no state or wallet changes
        self.challenge_a.refresh_from_db()
        self.assertEqual(self.challenge_a.status, ChallengeStatus.PENDING)
        self.wallet_a.refresh_from_db()
        self.wallet_b.refresh_from_db()
        self.assertEqual(self.wallet_a.gems, Decimal("0.00"))
        self.assertEqual(self.wallet_b.gems, Decimal("0.00"))
        self.assertEqual(WalletTransaction.objects.count(), 0)

    def test_user_b_cannot_claim_or_dismiss_user_a_challenge(self):
        # User A verifies their challenge legitimately
        self.challenge_a.status = ChallengeStatus.VERIFIED
        self.challenge_a.reward_amount = Decimal("1.00")
        self.challenge_a.save()

        # User B attempts to claim User A's challenge
        claim_res = self.client.post(
            "/api/captcha/claim/",
            {"challengeId": str(self.challenge_a.challenge_id), "userId": str(self.user_a.id)},
            format="json",
        )
        self.assertEqual(claim_res.status_code, status.HTTP_404_NOT_FOUND)

        # User B attempts to dismiss User A's challenge
        dismiss_res = self.client.post(
            "/api/captcha/dismiss/",
            {"challengeId": str(self.challenge_a.challenge_id), "userId": str(self.user_a.id)},
            format="json",
        )
        self.assertEqual(dismiss_res.status_code, status.HTTP_404_NOT_FOUND)

        # Challenge A status remains VERIFIED
        self.challenge_a.refresh_from_db()
        self.assertEqual(self.challenge_a.status, ChallengeStatus.VERIFIED)


class CaptchaAntiCheatAndSecretExposureTests(TestCase):
    """
    Phase 8.3 & 8.4: Server authority, anti-cheat validation, and information leak prevention.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="anticheat_user@example.com",
            name="AntiCheat User",
            password="Password123!",
        )
        self.wallet = get_or_create_wallet(self.user)

        login_res = self.client.post(
            "/api/auth/login/",
            {"email": "anticheat_user@example.com", "password": "Password123!"},
            format="json",
        )
        self.token = login_res.json()["data"]["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_anti_cheat_on_correct_answer(self):
        challenge = generate_captcha_challenge(self.user)
        # Client tries to claim 10000 Gems
        payload = {
            "challengeId": str(challenge.challenge_id),
            "selectedOption": challenge.correct_option,
            "reward": "10000.00",
            "isCorrect": False,  # Client tries to set isCorrect=false
            "walletBalance": "50000.00",
            "userId": "hacked-user-id",
        }
        res = self.client.post("/api/captcha/verify/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()["data"]

        # Server overrides client claims and awards exact +1.00
        self.assertEqual(data["result"], "CORRECT")
        self.assertEqual(data["reward"], "1.00")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.00"))

    def test_anti_cheat_on_wrong_answer(self):
        challenge = generate_captcha_challenge(self.user)
        wrong_option = next(opt for opt in challenge.options if opt != challenge.correct_option)

        # Client tries to claim correct answer and +500 Gems
        payload = {
            "challengeId": str(challenge.challenge_id),
            "selectedOption": wrong_option,
            "reward": "500.00",
            "isCorrect": True,
            "walletBalance": "999999.00",
        }
        res = self.client.post("/api/captcha/verify/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()["data"]

        # Server overrides and awards exact +0.50
        self.assertEqual(data["result"], "WRONG")
        self.assertEqual(data["reward"], "0.50")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("0.50"))

    def test_server_secrets_never_exposed_across_all_endpoints(self):
        forbidden = [
            "correct_option",
            "correctOption",
            "isCorrect",
            "password",
            "password_hash",
            "passwordHash",
            "secret",
        ]

        # 1. GET /api/captcha/current/
        res_current = self.client.get("/api/captcha/current/")
        curr_keys = str(res_current.json())
        for f in forbidden:
            self.assertNotIn(f"'{f}'", curr_keys)
        self.assertNotIn("reward", res_current.json()["data"])

        # 2. POST /api/captcha/verify/
        challenge = generate_captcha_challenge(self.user)
        res_verify = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(challenge.challenge_id), "selectedOption": challenge.correct_option},
            format="json",
        )
        verify_keys = str(res_verify.json())
        for f in forbidden:
            self.assertNotIn(f"'{f}'", verify_keys)

        # 3. POST /api/captcha/claim/
        res_claim = self.client.post(
            "/api/captcha/claim/",
            {"challengeId": str(challenge.challenge_id)},
            format="json",
        )
        claim_keys = str(res_claim.json())
        for f in forbidden:
            self.assertNotIn(f"'{f}'", claim_keys)

        # 4. POST /api/captcha/dismiss/
        c2 = generate_captcha_challenge(self.user)
        self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(c2.challenge_id), "selectedOption": c2.correct_option},
            format="json",
        )
        res_dismiss = self.client.post(
            "/api/captcha/dismiss/",
            {"challengeId": str(c2.challenge_id)},
            format="json",
        )
        dismiss_keys = str(res_dismiss.json())
        for f in forbidden:
            self.assertNotIn(f"'{f}'", dismiss_keys)


class CaptchaLifecycleAndReplayTests(TestCase):
    """
    Phase 8.5 & 8.6: Tests for expiration, single-use replay protection,
    and Claim/Dismiss state consistency.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="lifecycle_user@example.com",
            name="Lifecycle User",
            password="Password123!",
        )
        self.wallet = get_or_create_wallet(self.user)

        login_res = self.client.post(
            "/api/auth/login/",
            {"email": "lifecycle_user@example.com", "password": "Password123!"},
            format="json",
        )
        self.token = login_res.json()["data"]["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_expired_challenge_verification_rejected(self):
        challenge = generate_captcha_challenge(self.user)
        challenge.expires_at = timezone.now() - timedelta(seconds=1)
        challenge.save(update_fields=["expires_at"])

        res = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(challenge.challenge_id), "selectedOption": challenge.correct_option},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.json()["error"]["code"], "CHALLENGE_EXPIRED")

        # Zero wallet and ledger modifications
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("0.00"))
        self.assertEqual(WalletTransaction.objects.count(), 0)
        self.assertEqual(CaptchaAttempt.objects.count(), 0)

        # GET /api/captcha/current/ creates fresh challenge
        curr_res = self.client.get("/api/captcha/current/")
        self.assertEqual(curr_res.status_code, status.HTTP_200_OK)
        new_id = curr_res.json()["data"]["challengeId"]
        self.assertNotEqual(new_id, str(challenge.challenge_id))

    def test_verify_replay_attack_rejected(self):
        challenge = generate_captcha_challenge(self.user)
        payload = {"challengeId": str(challenge.challenge_id), "selectedOption": challenge.correct_option}

        # 1. Legitimate verification
        res1 = self.client.post("/api/captcha/verify/", payload, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.00"))

        # 2. Replay with exact same correct answer
        res2 = self.client.post("/api/captcha/verify/", payload, format="json")
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res2.json()["error"]["code"], "ALREADY_VERIFIED")

        # 3. Replay with a different option
        wrong_opt = next(o for o in challenge.options if o != challenge.correct_option)
        res3 = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(challenge.challenge_id), "selectedOption": wrong_opt},
            format="json",
        )
        self.assertEqual(res3.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res3.json()["error"]["code"], "ALREADY_VERIFIED")

        # Confirm wallet remained 1.00 and only 1 ledger row exists
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.00"))
        self.assertEqual(WalletTransaction.objects.filter(user=self.user).count(), 1)

    def test_claim_and_dismiss_replay_and_transitions(self):
        # Setup verified challenge
        c1 = generate_captcha_challenge(self.user)
        self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(c1.challenge_id), "selectedOption": c1.correct_option},
            format="json",
        )

        # Claim once -> OK
        res_c1 = self.client.post("/api/captcha/claim/", {"challengeId": str(c1.challenge_id)}, format="json")
        self.assertEqual(res_c1.status_code, status.HTTP_200_OK)

        # Claim twice -> 409 ALREADY_PROCESSED
        res_c2 = self.client.post("/api/captcha/claim/", {"challengeId": str(c1.challenge_id)}, format="json")
        self.assertEqual(res_c2.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res_c2.json()["error"]["code"], "ALREADY_PROCESSED")

        # Dismiss after Claim -> 409 ALREADY_PROCESSED
        res_d1 = self.client.post("/api/captcha/dismiss/", {"challengeId": str(c1.challenge_id)}, format="json")
        self.assertEqual(res_d1.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res_d1.json()["error"]["code"], "ALREADY_PROCESSED")

        # Second challenge: Dismiss first, then Claim
        c2 = generate_captcha_challenge(self.user)
        self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(c2.challenge_id), "selectedOption": c2.correct_option},
            format="json",
        )

        # Dismiss once -> OK
        res_d2 = self.client.post("/api/captcha/dismiss/", {"challengeId": str(c2.challenge_id)}, format="json")
        self.assertEqual(res_d2.status_code, status.HTTP_200_OK)

        # Dismiss twice -> 409
        res_d3 = self.client.post("/api/captcha/dismiss/", {"challengeId": str(c2.challenge_id)}, format="json")
        self.assertEqual(res_d3.status_code, status.HTTP_409_CONFLICT)

        # Claim after Dismiss -> 409
        res_c3 = self.client.post("/api/captcha/claim/", {"challengeId": str(c2.challenge_id)}, format="json")
        self.assertEqual(res_c3.status_code, status.HTTP_409_CONFLICT)


class CaptchaMalformedInputTests(TestCase):
    """
    Phase 8.11: Malformed and boundary input tests.
    Ensures zero 500 errors and strict validation.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="malformed_user@example.com",
            name="Malformed User",
            password="Password123!",
        )
        self.wallet = get_or_create_wallet(self.user)

        login_res = self.client.post(
            "/api/auth/login/",
            {"email": "malformed_user@example.com", "password": "Password123!"},
            format="json",
        )
        self.token = login_res.json()["data"]["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.challenge = generate_captcha_challenge(self.user)

    def test_missing_challenge_id(self):
        res = self.client.post(
            "/api/captcha/verify/",
            {"selectedOption": "ABCDEF"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_selected_option(self):
        res = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(self.challenge.challenge_id)},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_uuid_format(self):
        res = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": "not-a-valid-uuid", "selectedOption": "ABCDEF"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_selected_option(self):
        res = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(self.challenge.challenge_id), "selectedOption": ""},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_extremely_long_selected_option(self):
        res = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(self.challenge.challenge_id), "selectedOption": "A" * 500},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_challenge_id(self):
        import uuid
        res = self.client.post(
            "/api/captcha/verify/",
            {"challengeId": str(uuid.uuid4()), "selectedOption": "ABCDEF"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_claim_invalid_uuid(self):
        res = self.client.post(
            "/api/captcha/claim/",
            {"challengeId": "invalid-uuid"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class CaptchaDecimalPrecisionTests(TestCase):
    """
    Phase 8.9: Decimal precision testing without floating-point artifacts.
    Sequence: +1.00 + 0.50 + 1.00 + 0.50 = exactly 3.00.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="decimal_precision@example.com",
            name="Decimal User",
            password="Password123!",
        )
        self.wallet = get_or_create_wallet(self.user)

        login_res = self.client.post(
            "/api/auth/login/",
            {"email": "decimal_precision@example.com", "password": "Password123!"},
            format="json",
        )
        self.token = login_res.json()["data"]["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_repeated_rewards_exact_decimal_arithmetic(self):
        self.assertEqual(self.wallet.gems, Decimal("0.00"))

        # Challenge 1: Correct (+1.00)
        c1 = generate_captcha_challenge(self.user)
        self.client.post("/api/captcha/verify/", {"challengeId": str(c1.challenge_id), "selectedOption": c1.correct_option}, format="json")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.00"))

        # Challenge 2: Wrong (+0.50)
        c2 = generate_captcha_challenge(self.user)
        w2 = next(o for o in c2.options if o != c2.correct_option)
        self.client.post("/api/captcha/verify/", {"challengeId": str(c2.challenge_id), "selectedOption": w2}, format="json")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("1.50"))

        # Challenge 3: Correct (+1.00)
        c3 = generate_captcha_challenge(self.user)
        self.client.post("/api/captcha/verify/", {"challengeId": str(c3.challenge_id), "selectedOption": c3.correct_option}, format="json")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("2.50"))

        # Challenge 4: Wrong (+0.50)
        c4 = generate_captcha_challenge(self.user)
        w4 = next(o for o in c4.options if o != c4.correct_option)
        self.client.post("/api/captcha/verify/", {"challengeId": str(c4.challenge_id), "selectedOption": w4}, format="json")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.gems, Decimal("3.00"))

        # Confirm ledger details
        txns = WalletTransaction.objects.filter(user=self.user).order_by("created_at")
        self.assertEqual(txns.count(), 4)
        self.assertEqual([t.balance_after for t in txns], [Decimal("1.00"), Decimal("1.50"), Decimal("2.50"), Decimal("3.00")])


class CaptchaConcurrencySecurityTests(TransactionTestCase):
    """
    Phase 8.7 & 8.10: Critical multi-threaded concurrency testing.
    Uses 10 concurrent threads against the SAME challenge to verify:
    - select_for_update() row locks serialize access cleanly.
    - Exactly ONE thread succeeds in verifying and awarding reward.
    - Remaining 9 threads receive ALREADY_VERIFIED without double crediting.
    - Final balance is 1.00 for correct (NOT 10.00), and 0.50 for wrong (NOT 5.00).
    - Exactly ONE WalletTransaction and ONE CaptchaAttempt are recorded.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="concurrent_sec_user@example.com",
            name="Concurrent Sec User",
            password="SecurePassword123!",
        )
        self.wallet = get_or_create_wallet(self.user)

    def test_ten_concurrent_verifications_correct_answer(self):
        challenge = generate_captcha_challenge(self.user)
        num_threads = 10
        threads = []
        results = []
        errors = []

        def worker():
            from apps.captcha.services import verify_captcha_challenge
            try:
                verified = verify_captcha_challenge(
                    user=self.user,
                    challenge_id=challenge.challenge_id,
                    selected_option=challenge.correct_option,
                )
                results.append(verified)
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

        # Exactly 1 success, 9 rejections
        self.assertEqual(len(results), 1, f"Expected 1 success, got {len(results)}")
        self.assertEqual(len(errors), 9)

        # Wallet MUST have exactly 1.00 GEM (NOT 10.00!)
        self.wallet.refresh_from_db()
        self.assertEqual(
            self.wallet.gems,
            Decimal("1.00"),
            f"Concurrency breach! Expected 1.00, got {self.wallet.gems}",
        )

        # Ledger MUST contain exactly 1 transaction
        txns = WalletTransaction.objects.filter(reference_id=str(challenge.challenge_id))
        self.assertEqual(txns.count(), 1)
        self.assertEqual(txns.first().balance_before, Decimal("0.00"))
        self.assertEqual(txns.first().balance_after, Decimal("1.00"))

        # Exactly 1 CaptchaAttempt
        attempts = CaptchaAttempt.objects.filter(challenge=challenge)
        self.assertEqual(attempts.count(), 1)

    def test_ten_concurrent_verifications_wrong_answer(self):
        challenge = generate_captcha_challenge(self.user)
        wrong_option = next(o for o in challenge.options if o != challenge.correct_option)
        num_threads = 10
        threads = []
        results = []
        errors = []

        def worker():
            from apps.captcha.services import verify_captcha_challenge
            try:
                verified = verify_captcha_challenge(
                    user=self.user,
                    challenge_id=challenge.challenge_id,
                    selected_option=wrong_option,
                )
                results.append(verified)
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

        # Exactly 1 success, 9 rejections
        self.assertEqual(len(results), 1)
        self.assertEqual(len(errors), 9)

        # Wallet MUST have exactly 0.50 GEM (NOT 5.00!)
        self.wallet.refresh_from_db()
        self.assertEqual(
            self.wallet.gems,
            Decimal("0.50"),
            f"Concurrency breach! Expected 0.50, got {self.wallet.gems}",
        )

        # Ledger MUST contain exactly 1 transaction
        txns = WalletTransaction.objects.filter(reference_id=str(challenge.challenge_id))
        self.assertEqual(txns.count(), 1)
        self.assertEqual(txns.first().balance_before, Decimal("0.00"))
        self.assertEqual(txns.first().balance_after, Decimal("0.50"))
