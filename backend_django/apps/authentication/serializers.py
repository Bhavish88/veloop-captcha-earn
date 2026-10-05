from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.core.models import AccountStatus
from apps.core.exceptions import AppException
from apps.wallets.services import get_or_create_wallet

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    """Serializes user info for public/authenticated consumption without password hash."""
    accountStatus = serializers.CharField(source="account_status", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "role",
            "accountStatus",
        ]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=True, min_length=2, max_length=100)
    password = serializers.CharField(required=True, min_length=8, write_only=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email=normalized).exists():
            raise AppException(
                message="Email already registered",
                code="EMAIL_ALREADY_REGISTERED",
                status_code=409,
            )
        return normalized

    def validate_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise AppException(
                message="Name must be at least 2 characters",
                code="INVALID_REGISTRATION_DATA",
                status_code=400,
            )
        return cleaned

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data["email"],
                name=validated_data["name"],
                password=validated_data["password"],
            )
            # Automatically create wallet inside same transaction
            get_or_create_wallet(user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        if not email or not password:
            raise AppException(
                message="Email and password are required",
                code="INVALID_LOGIN_DATA",
                status_code=400,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AppException(
                message="Invalid email or password",
                code="INVALID_CREDENTIALS",
                status_code=401,
            )

        if not user.check_password(password):
            raise AppException(
                message="Invalid email or password",
                code="INVALID_CREDENTIALS",
                status_code=401,
            )

        if user.account_status != AccountStatus.ACTIVE:
            raise AppException(
                message="Account is not active",
                code="ACCOUNT_NOT_ACTIVE",
                status_code=403,
            )

        attrs["user"] = user
        return attrs
