from math import ceil
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.core.exceptions import AppException
from .models import Wallet, WalletTransaction
from .serializers import WalletSerializer, WalletSummarySerializer, WalletTransactionSerializer
from .services import get_or_create_wallet


class WalletDetailView(APIView):
    """
    Returns the authenticated user's wallet.
    The user identity is strictly derived from the authenticated JWT.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = get_or_create_wallet(request.user)
        serializer = WalletSerializer(wallet)
        return Response(
            {
                "success": True,
                "data": {
                    "wallet": serializer.data,
                },
            },
            status=status.HTTP_200_OK,
        )


class WalletSummaryView(APIView):
    """
    Returns currency balances for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = get_or_create_wallet(request.user)
        serializer = WalletSummarySerializer(wallet)
        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class WalletTransactionsView(APIView):
    """
    Returns paginated ledger transactions for the authenticated user, newest first.
    Optional query params: page, limit, currency, direction.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page = int(request.query_params.get("page", 1))
            limit = int(request.query_params.get("limit", 20))
        except ValueError:
            raise AppException(message="Page and limit must be integers.", code="INVALID_PAGINATION", status_code=400)

        if page < 1:
            raise AppException(message="Page must be a positive integer.", code="INVALID_PAGE", status_code=400)
        if limit < 1 or limit > 100:
            raise AppException(message="Limit must be between 1 and 100.", code="INVALID_LIMIT", status_code=400)

        currency = request.query_params.get("currency")
        direction = request.query_params.get("direction")

        queryset = WalletTransaction.objects.filter(user=request.user)

        if currency:
            queryset = queryset.filter(currency=currency.upper())
        if direction:
            queryset = queryset.filter(direction=direction.upper())

        total = queryset.count()
        start = (page - 1) * limit
        end = start + limit
        transactions = queryset[start:end]

        serializer = WalletTransactionSerializer(transactions, many=True)
        total_pages = ceil(total / limit) if limit > 0 else 1

        return Response(
            {
                "success": True,
                "data": {
                    "transactions": serializer.data,
                    "pagination": {
                        "page": page,
                        "limit": limit,
                        "total": total,
                        "totalPages": total_pages,
                    },
                },
            },
            status=status.HTTP_200_OK,
        )
