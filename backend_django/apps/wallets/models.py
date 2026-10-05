import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models


class Currency(models.TextChoices):
    GEM = "GEM", "Gems"
    VE = "VE", "VEs"
    SVE = "SVE", "SVEs"
    TOKEN = "TOKEN", "Tokens"
    SPIN = "SPIN", "Spins"


class TransactionDirection(models.TextChoices):
    CREDIT = "CREDIT", "Credit"
    DEBIT = "DEBIT", "Debit"


class TransactionType(models.TextChoices):
    # Rewards
    CAPTCHA_REWARD = "CAPTCHA_REWARD", "Captcha Reward"
    REWARD = "REWARD", "Reward"
    BONUS = "BONUS", "Bonus"
    DAILY_REWARD = "DAILY_REWARD", "Daily Reward"
    AD_REWARD = "AD_REWARD", "Ad Reward"
    GAME_REWARD = "GAME_REWARD", "Game Reward"
    REFERRAL = "REFERRAL", "Referral"
    # Administrative
    ADMIN_CREDIT = "ADMIN_CREDIT", "Admin Credit"
    ADMIN_DEBIT = "ADMIN_DEBIT", "Admin Debit"
    CORRECTION = "CORRECTION", "Correction"
    # Exchange / Withdrawal
    EXCHANGE_CREDIT = "EXCHANGE_CREDIT", "Exchange Credit"
    EXCHANGE_DEBIT = "EXCHANGE_DEBIT", "Exchange Debit"
    WITHDRAWAL = "WITHDRAWAL", "Withdrawal"
    WITHDRAWAL_REVERSAL = "WITHDRAWAL_REVERSAL", "Withdrawal Reversal"


class TransactionStatus(models.TextChoices):
    COMPLETED = "COMPLETED", "Completed"
    REVERSED = "REVERSED", "Reversed"
    PENDING = "PENDING", "Pending"


class Wallet(models.Model):
    """
    Stores server-authoritative balances for all supported VELoop currencies.
    - OneToOneField with User prevents duplicate wallets.
    - Gems uses DecimalField to support fractional amounts (e.g. +1.00, +0.50).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet",
    )

    # Gems supports fractional earnings (+1.00 correct, +0.50 wrong)
    gems = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    ves = models.BigIntegerField(default=0)
    sves = models.BigIntegerField(default=0)
    tokens = models.BigIntegerField(default=0)
    spins = models.BigIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wallets_wallet"
        verbose_name = "Wallet"
        verbose_name_plural = "Wallets"

    def __str__(self):
        return f"Wallet({self.user.email} - GEM: {self.gems}, VE: {self.ves})"


class WalletTransaction(models.Model):
    """
    Immutable append-only ledger for all wallet balance mutations.
    Records balance_before and balance_after to guarantee auditable reconciliation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    currency = models.CharField(
        max_length=10,
        choices=Currency.choices,
    )
    direction = models.CharField(
        max_length=10,
        choices=TransactionDirection.choices,
    )
    type = models.CharField(
        max_length=50,
        choices=TransactionType.choices,
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
    )
    balance_before = models.DecimalField(
        max_digits=14,
        decimal_places=2,
    )
    balance_after = models.DecimalField(
        max_digits=14,
        decimal_places=2,
    )
    source = models.CharField(
        max_length=50,
        default="SYSTEM",
    )
    reference_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.COMPLETED,
    )
    description = models.CharField(
        max_length=500,
        null=True,
        blank=True,
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        db_table = "wallets_transaction"
        verbose_name = "Wallet Transaction"
        verbose_name_plural = "Wallet Transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["wallet", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.transaction_id} ({self.direction} {self.amount} {self.currency})"
