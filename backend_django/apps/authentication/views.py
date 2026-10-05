from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.core.exceptions import AppException
from .serializers import RegisterSerializer, LoginSerializer, UserSummarySerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "refreshToken": str(refresh),
    }


class RegisterView(APIView):
    """
    Registers a new user and automatically initializes an empty wallet.
    Returns the user summary along with JWT access and refresh tokens.
    """
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = get_tokens_for_user(user)
        user_data = UserSummarySerializer(user).data

        return Response(
            {
                "success": True,
                "data": {
                    "user": user_data,
                    "token": tokens["token"],
                    "refreshToken": tokens["refreshToken"],
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    Authenticates user credentials and verifies active account status.
    Returns user summary along with JWT access and refresh tokens.
    """
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        tokens = get_tokens_for_user(user)
        user_data = UserSummarySerializer(user).data

        return Response(
            {
                "success": True,
                "data": {
                    "user": user_data,
                    "token": tokens["token"],
                    "refreshToken": tokens["refreshToken"],
                },
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    Returns the profile summary of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = UserSummarySerializer(request.user).data
        return Response(
            {
                "success": True,
                "data": {
                    "user": user_data,
                },
            },
            status=status.HTTP_200_OK,
        )


class TokenRefreshCustomView(APIView):
    """
    Custom wrapper around SimpleJWT TokenRefreshView to ensure standardized response envelope.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refreshToken") or request.data.get("refresh")
        if not refresh_token:
            raise AppException(
                message="Refresh token is required",
                code="REFRESH_TOKEN_REQUIRED",
                status_code=400,
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
        except Exception:
            raise AppException(
                message="Token is invalid or expired",
                code="INVALID_REFRESH_TOKEN",
                status_code=401,
            )

        return Response(
            {
                "success": True,
                "data": {
                    "token": access_token,
                },
            },
            status=status.HTTP_200_OK,
        )
