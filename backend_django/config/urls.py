"""
URL configuration for VELoop CAPTCHA Earn project.
"""

from django.contrib import admin
from django.urls import path, re_path, include
from apps.wallets.views import WalletDetailView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("apps.core.urls")),
    path("api/auth/", include("apps.authentication.urls")),
    re_path(r"^api/wallet/?$", WalletDetailView.as_view(), name="wallet_detail"),
    path("api/wallet/", include("apps.wallets.urls")),
    path("api/captcha/", include("apps.captcha.urls")),
]

