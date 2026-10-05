import uuid
from decimal import Decimal
from django.db import transaction
from apps.core.exceptions import AppException
from .models import Wallet, WalletTransaction, Currency, TransactionDirection, TransactionStatus


CURRENCY_FIELD_MAP = {
    Currency.GEM: "gems",
    Currency.VE: "ves",
    Currency.SVE: "sves",
    Currency.TOKEN: "tokens",
    Currency.SPIN: "spins",
}


class InsufficientBalanceException(AppException):
    status_code = 400
    default_code = "INSUFFICIENT_BALANCE"
    default_detail = "Insufficient wallet balance for this operation."


class WalletNotFoundException(AppException):
    status_code = 404
    default_code = "WALLET_NOT_FOUND"
    default_detail = "Wallet could not be found for the specified user."


def generate_transaction_id():
    return f"TXN_{uuid.uuid4().hex.upper()}"


def get_currency_field(currency):
    if currency not in CURRENCY_FIELD_MAP:
        raise AppException(
            message=f"Unsupported currency: {currency}",
            code="INVALID_CURRENCY",
            status_code=400,
        )
    return CURRENCY_FIELD_MAP[currency]


def get_or_create_wallet(user):
    """
    Safely retrieves the user's wallet or creates one if it does not yet exist.
    Guaranteed atomic and non-duplicative.
    """
    with transaction.atomic():
        wallet, _ = Wallet.objects.get_or_create(
            user=user,
            defaults={
                "gems": Decimal("0.00"),
                "ves": 0,
                "sves": 0,
                "tokens": 0,
                "spins": 0,
            },
        )
    return wallet


def credit_wallet(
    user,
    currency,
    amount,
    type,
    source="SYSTEM",
    reference_id=None,
    description=None,
    metadata=None,
):
    """
    Atomically credits the user's wallet using row-level locking (select_for_update).
    Appends an immutable ledger transaction with exact balance_before and balance_after.
    """
    amount = Decimal(str(amount))
    if amount <= Decimal("0"):
        raise AppException(
            message="Credit amount must be positive.",
            code="INVALID_AMOUNT",
            status_code=400,
        )

    field_name = get_currency_field(currency)

    with transaction.atomic():
        try:
            wallet = Wallet.objects.select_for_update().get(user=user)
        except Wallet.DoesNotExist:
            raise WalletNotFoundException()

        current_val = getattr(wallet, field_name)
        balance_before = Decimal(str(current_val))
        balance_after = balance_before + amount

        # Save wallet balance
        if field_name == "gems":
            setattr(wallet, field_name, balance_after)
        else:
            setattr(wallet, field_name, int(balance_after))

        wallet.save(update_fields=[field_name, "updated_at"])

        # Create immutable ledger transaction
        txn = WalletTransaction.objects.create(
            transaction_id=generate_transaction_id(),
            user=user,
            wallet=wallet,
            currency=currency,
            direction=TransactionDirection.CREDIT,
            type=type,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            source=source,
            reference_id=reference_id,
            status=TransactionStatus.COMPLETED,
            description=description,
            metadata=metadata or {},
        )

    return wallet, txn


def debit_wallet(
    user,
    currency,
    amount,
    type,
    source="SYSTEM",
    reference_id=None,
    description=None,
    metadata=None,
):
    """
    Atomically debits the user's wallet using row-level locking (select_for_update).
    Ensures sufficient funds before applying mutation.
    """
    amount = Decimal(str(amount))
    if amount <= Decimal("0"):
        raise AppException(
            message="Debit amount must be positive.",
            code="INVALID_AMOUNT",
            status_code=400,
        )

    field_name = get_currency_field(currency)

    with transaction.atomic():
        try:
            wallet = Wallet.objects.select_for_update().get(user=user)
        except Wallet.DoesNotExist:
            raise WalletNotFoundException()

        current_val = getattr(wallet, field_name)
        balance_before = Decimal(str(current_val))

        if balance_before < amount:
            raise InsufficientBalanceException()

        balance_after = balance_before - amount

        if field_name == "gems":
            setattr(wallet, field_name, balance_after)
        else:
            setattr(wallet, field_name, int(balance_after))

        wallet.save(update_fields=[field_name, "updated_at"])

        txn = WalletTransaction.objects.create(
            transaction_id=generate_transaction_id(),
            user=user,
            wallet=wallet,
            currency=currency,
            direction=TransactionDirection.DEBIT,
            type=type,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            source=source,
            reference_id=reference_id,
            status=TransactionStatus.COMPLETED,
            description=description,
            metadata=metadata or {},
        )

    return wallet, txn
