import random
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

from apps.core.exceptions import AppException
from apps.wallets.models import Currency, TransactionType
from apps.wallets.services import credit_wallet
from .models import (
    CaptchaChallenge,
    CaptchaAttempt,
    ChallengeStatus,
    ChallengeResult,
    RewardStatus,
)

# Uppercase letters and numbers, excluding visually ambiguous characters (O, 0, I, 1)
ALLOWED_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CAPTCHA_LENGTH = 6
CHALLENGE_TTL_SECONDS = 120

SIMILAR_REPLACEMENTS = {
    "S": ["5", "8"],
    "5": ["S", "6"],
    "B": ["8", "D"],
    "8": ["B", "9"],
    "Z": ["2", "7"],
    "2": ["Z", "3"],
    "C": ["G", "Q"],
    "G": ["C", "6"],
    "V": ["U", "Y"],
    "U": ["V", "W"],
    "D": ["B", "P"],
    "E": ["F", "3"],
    "F": ["E", "P"],
    "K": ["X", "H"],
    "X": ["K", "Y"],
    "P": ["R", "D"],
    "R": ["P", "B"],
    "7": ["T", "Z"],
    "T": ["7", "Y"],
}


def generate_random_captcha_text(length=CAPTCHA_LENGTH):
    return "".join(random.choices(ALLOWED_ALPHABET, k=length))


def generate_similar_option(base_text, exclude_set):
    """
    Produces a subtly altered variant of base_text (modifying 1-2 characters or swapping adjacent).
    Guarantees the output is distinct from all items in exclude_set.
    """
    for _ in range(50):
        chars = list(base_text)
        mode = random.choice(["replace_similar", "replace_random", "swap_adjacent"])

        if mode == "replace_similar":
            indices = [i for i, c in enumerate(chars) if c in SIMILAR_REPLACEMENTS]
            if indices:
                idx = random.choice(indices)
                chars[idx] = random.choice(SIMILAR_REPLACEMENTS[chars[idx]])
            else:
                idx = random.randrange(len(chars))
                chars[idx] = random.choice([c for c in ALLOWED_ALPHABET if c != chars[idx]])

        elif mode == "replace_random":
            idx = random.randrange(len(chars))
            chars[idx] = random.choice([c for c in ALLOWED_ALPHABET if c != chars[idx]])

        elif mode == "swap_adjacent":
            idx = random.randrange(len(chars) - 1)
            chars[idx], chars[idx + 1] = chars[idx + 1], chars[idx]

        candidate = "".join(chars)
        if candidate not in exclude_set and len(candidate) == CAPTCHA_LENGTH:
            return candidate

    while True:
        idx = random.randrange(len(base_text))
        replacement = random.choice([c for c in ALLOWED_ALPHABET if c != base_text[idx]])
        candidate = base_text[:idx] + replacement + base_text[idx + 1 :]
        if candidate not in exclude_set:
            return candidate


def generate_different_option(exclude_set):
    """
    Generates a completely distinct random alphanumeric string.
    """
    while True:
        candidate = generate_random_captcha_text()
        if candidate not in exclude_set:
            return candidate


def generate_captcha_challenge(user):
    """
    Generates a new CaptchaChallenge for the user:
    - 6-character alphanumeric string without ambiguous characters
    - 4 distinct options: 1 correct, 2 similar wrong, 1 completely different
    - Shuffled order
    - 120-second expiration
    """
    captcha_text = generate_random_captcha_text()
    correct_option = captcha_text

    used_options = {correct_option}
    similar_1 = generate_similar_option(captcha_text, used_options)
    used_options.add(similar_1)

    similar_2 = generate_similar_option(captcha_text, used_options)
    used_options.add(similar_2)

    different = generate_different_option(used_options)
    used_options.add(different)

    options = [correct_option, similar_1, similar_2, different]
    random.shuffle(options)

    now = timezone.now()
    expires_at = now + timedelta(seconds=CHALLENGE_TTL_SECONDS)

    challenge = CaptchaChallenge.objects.create(
        user=user,
        captcha_text=captcha_text,
        options=options,
        correct_option=correct_option,
        status=ChallengeStatus.PENDING,
        expires_at=expires_at,
    )

    return challenge


def get_or_create_current_challenge(user):
    """
    Returns the user's active, unexpired pending challenge.
    If none exists, or if the current one has expired, marks expired challenges
    and generates a new one.
    Guaranteed atomic per user.
    """
    now = timezone.now()

    with transaction.atomic():
        # Clean up any pending challenges that have expired
        CaptchaChallenge.objects.filter(
            user=user,
            status=ChallengeStatus.PENDING,
            expires_at__lte=now,
        ).update(
            status=ChallengeStatus.EXPIRED,
            result=ChallengeResult.EXPIRED,
        )

        # Look for an active, unexpired challenge
        active_challenge = (
            CaptchaChallenge.objects.filter(
                user=user,
                status=ChallengeStatus.PENDING,
                expires_at__gt=now,
            )
            .order_by("-created_at")
            .first()
        )

        if active_challenge:
            return active_challenge

        # None found: generate a new one
        return generate_captcha_challenge(user)


def verify_captcha_challenge(user, challenge_id, selected_option, ip_address=None):
    """
    Atomically verifies user's answer, awards rewards, and creates ledger entry.
    - select_for_update() row lock prevents race conditions and replay attacks.
    - Server calculates reward (+1.00 correct, +0.50 wrong).
    - Credits wallet inside the atomic transaction.
    - Creates CaptchaAttempt audit record.
    """
    with transaction.atomic():
        try:
            challenge = CaptchaChallenge.objects.select_for_update().get(
                challenge_id=challenge_id,
                user=user,
            )
        except CaptchaChallenge.DoesNotExist:
            raise AppException(
                message="Challenge not found.",
                code="CHALLENGE_NOT_FOUND",
                status_code=404,
            )

        now = timezone.now()

        # Reject already processed challenges
        if challenge.status != ChallengeStatus.PENDING:
            raise AppException(
                message="Challenge has already been submitted.",
                code="ALREADY_VERIFIED",
                status_code=409,
            )

        # Check expiration
        if now >= challenge.expires_at:
            challenge.status = ChallengeStatus.EXPIRED
            challenge.result = ChallengeResult.EXPIRED
            challenge.save(update_fields=["status", "result"])
            raise AppException(
                message="Challenge has expired.",
                code="CHALLENGE_EXPIRED",
                status_code=400,
            )

        # Check that selected_option is valid and one of the challenge options
        if not selected_option or selected_option not in challenge.options:
            raise AppException(
                message="Invalid option selected.",
                code="INVALID_OPTION",
                status_code=400,
            )

        # Server-authoritative correctness and reward calculation
        is_correct = (selected_option == challenge.correct_option)
        result = ChallengeResult.CORRECT if is_correct else ChallengeResult.WRONG
        reward = Decimal("1.00") if is_correct else Decimal("0.50")

        # Update challenge state
        challenge.selected_option = selected_option
        challenge.result = result
        challenge.reward_amount = reward
        challenge.reward_status = RewardStatus.CREDITED
        challenge.status = ChallengeStatus.VERIFIED
        challenge.completed_at = now
        challenge.save(
            update_fields=[
                "selected_option",
                "result",
                "reward_amount",
                "reward_status",
                "status",
                "completed_at",
            ]
        )

        # Create immutable audit record
        CaptchaAttempt.objects.create(
            challenge=challenge,
            user=user,
            selected_option=selected_option,
            result=result,
            reward=reward,
            status="COMPLETED",
            ip_address=ip_address,
        )

        # Atomically credit wallet using existing service
        credit_wallet(
            user=user,
            currency=Currency.GEM,
            amount=reward,
            type=TransactionType.CAPTCHA_REWARD,
            source="CAPTCHA",
            reference_id=str(challenge.challenge_id),
            description=f"CAPTCHA reward ({result}): +{reward} GEM",
            metadata={
                "challengeId": str(challenge.challenge_id),
                "result": result,
            },
        )

        return challenge


def claim_captcha_challenge(user, challenge_id):
    """
    Finalizes the mock-rewarded ad claim flow.
    Transitions status to CLAIMED.
    NEVER credits additional Gems or creates ledger entries.
    """
    with transaction.atomic():
        try:
            challenge = CaptchaChallenge.objects.select_for_update().get(
                challenge_id=challenge_id,
                user=user,
            )
        except CaptchaChallenge.DoesNotExist:
            raise AppException(
                message="Challenge not found.",
                code="CHALLENGE_NOT_FOUND",
                status_code=404,
            )

        if challenge.status == ChallengeStatus.PENDING:
            raise AppException(
                message="Challenge has not been verified yet.",
                code="CHALLENGE_NOT_VERIFIED",
                status_code=400,
            )

        if challenge.status in [ChallengeStatus.CLAIMED, ChallengeStatus.DISMISSED]:
            raise AppException(
                message="Challenge has already been claimed or dismissed.",
                code="ALREADY_PROCESSED",
                status_code=409,
            )

        if challenge.status != ChallengeStatus.VERIFIED:
            raise AppException(
                message=f"Cannot claim challenge with status {challenge.status}.",
                code="INVALID_STATUS",
                status_code=400,
            )

        challenge.status = ChallengeStatus.CLAIMED
        if not challenge.completed_at:
            challenge.completed_at = timezone.now()
        challenge.save(update_fields=["status", "completed_at"])

        return challenge


def dismiss_captcha_challenge(user, challenge_id):
    """
    Finalizes the 'No Thanks' flow.
    Transitions status to DISMISSED.
    NEVER modifies wallet balance or creates ledger entries.
    """
    with transaction.atomic():
        try:
            challenge = CaptchaChallenge.objects.select_for_update().get(
                challenge_id=challenge_id,
                user=user,
            )
        except CaptchaChallenge.DoesNotExist:
            raise AppException(
                message="Challenge not found.",
                code="CHALLENGE_NOT_FOUND",
                status_code=404,
            )

        if challenge.status == ChallengeStatus.PENDING:
            raise AppException(
                message="Challenge has not been verified yet.",
                code="CHALLENGE_NOT_VERIFIED",
                status_code=400,
            )

        if challenge.status in [ChallengeStatus.CLAIMED, ChallengeStatus.DISMISSED]:
            raise AppException(
                message="Challenge has already been claimed or dismissed.",
                code="ALREADY_PROCESSED",
                status_code=409,
            )

        if challenge.status != ChallengeStatus.VERIFIED:
            raise AppException(
                message=f"Cannot dismiss challenge with status {challenge.status}.",
                code="INVALID_STATUS",
                status_code=400,
            )

        challenge.status = ChallengeStatus.DISMISSED
        if not challenge.completed_at:
            challenge.completed_at = timezone.now()
        challenge.save(update_fields=["status", "completed_at"])

        return challenge
