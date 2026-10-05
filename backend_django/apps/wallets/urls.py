from django.urls import path, re_path
from .views import WalletDetailView, WalletSummaryView, WalletTransactionsView

urlpatterns = [
    re_path(r"^$", WalletDetailView.as_view(), name="wallet_detail"),
    re_path(r"^summary/?$", WalletSummaryView.as_view(), name="wallet_summary"),
    re_path(r"^transactions/?$", WalletTransactionsView.as_view(), name="wallet_transactions"),
]
