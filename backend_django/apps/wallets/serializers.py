from rest_framework import serializers
from .models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    """
    Serializes wallet balances.
    Exposes decimal gems and safe integer currencies.
    """
    gems = serializers.DecimalField(max_digits=14, decimal_places=2, coerce_to_string=True)

    class Meta:
        model = Wallet
        fields = [
            "gems",
            "ves",
            "sves",
            "tokens",
            "spins",
            "updated_at",
        ]


class WalletSummarySerializer(serializers.ModelSerializer):
    gems = serializers.DecimalField(max_digits=14, decimal_places=2, coerce_to_string=True)

    class Meta:
        model = Wallet
        fields = [
            "ves",
            "sves",
            "gems",
            "tokens",
            "spins",
        ]


class WalletTransactionSerializer(serializers.ModelSerializer):
    transactionId = serializers.CharField(source="transaction_id", read_only=True)
    balanceBefore = serializers.DecimalField(
        source="balance_before", max_digits=14, decimal_places=2, coerce_to_string=True
    )
    balanceAfter = serializers.DecimalField(
        source="balance_after", max_digits=14, decimal_places=2, coerce_to_string=True
    )
    referenceId = serializers.CharField(source="reference_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = WalletTransaction
        fields = [
            "transactionId",
            "currency",
            "direction",
            "type",
            "amount",
            "balanceBefore",
            "balanceAfter",
            "source",
            "referenceId",
            "status",
            "description",
            "createdAt",
        ]
