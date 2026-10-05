from django.urls import re_path
from .views import RegisterView, LoginView, MeView, TokenRefreshCustomView

urlpatterns = [
    re_path(r"^register/?$", RegisterView.as_view(), name="auth_register"),
    re_path(r"^login/?$", LoginView.as_view(), name="auth_login"),
    re_path(r"^me/?$", MeView.as_view(), name="auth_me"),
    re_path(r"^token/refresh/?$", TokenRefreshCustomView.as_view(), name="token_refresh"),
]
