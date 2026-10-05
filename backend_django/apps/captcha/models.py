import uuid
from django.conf import settings
from django.db import models


class ChallengeStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    VERIFIED = "VERIFIED", "Verified"
    CLAIMED = "CLAIMED", "Claimed"
    DISMISSED = "DISMISSED", "Dismissed"
    EXPIRED = "EXPIRED", "Expired"


class ChallengeResult(models.TextChoices):
    CORRECT = "CORRECT", "Correct"
    WRONG = "WRONG", "Wrong"
    EXPIRED = "EXPIRED", "Expired"


class RewardStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    CREDITED = "CREDITED", "Credited"


class CaptchaChallenge(models.Model):
    """
    Server-authoritative CAPTCHA challenge lifecycle model.
    Stores the visual question, randomized options, and server-only correct_option.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        db_index=True,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="captcha_challenges",
    )
    captcha_text = models.CharField(max_length=16)
    options = models.JSONField(default=list)
    correct_option = models.CharField(max_length=16)
    status = models.CharField(
        max_length=20,
        choices=ChallengeStatus.choices,
        default=ChallengeStatus.PENDING,
        db_index=True,
    )
    expires_at = models.DateTimeField(db_index=True)
    selected_option = models.CharField(max_length=16, null=True, blank=True)
    result = models.CharField(
        max_length=20,
        choices=ChallengeResult.choices,
        null=True,
        blank=True,
    )
    reward_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    reward_status = models.CharField(
        max_length=20,
        choices=RewardStatus.choices,
        default=RewardStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "captcha_challenge"
        verbose_name = "CAPTCHA Challenge"
        verbose_name_plural = "CAPTCHA Challenges"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status", "expires_at"]),
        ]

    def __str__(self):
        return f"Challenge {self.challenge_id} ({self.user.email} - {self.status})"


class CaptchaAttempt(models.Model):
    """
    Immutable audit and attempt history log.
    Created strictly upon verification/audit events (not during generation).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey(
        CaptchaChallenge,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="captcha_attempts",
    )
    selected_option = models.CharField(max_length=16)
    result = models.CharField(max_length=20)
    reward = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "captcha_attempt"
        verbose_name = "CAPTCHA Attempt"
        verbose_name_plural = "CAPTCHA Attempts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["challenge", "-created_at"]),
        ]

    def __str__(self):
        return f"Attempt {self.id} ({self.user.email} - {self.result})"
