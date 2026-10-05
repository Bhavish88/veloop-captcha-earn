from django.urls import re_path
from .views import (
    CurrentCaptchaView,
    VerifyCaptchaView,
    ClaimCaptchaView,
    DismissCaptchaView,
)

urlpatterns = [
    re_path(r"^current/?$", CurrentCaptchaView.as_view(), name="captcha_current"),
    re_path(r"^verify/?$", VerifyCaptchaView.as_view(), name="captcha_verify"),
    re_path(r"^claim/?$", ClaimCaptchaView.as_view(), name="captcha_claim"),
    re_path(r"^dismiss/?$", DismissCaptchaView.as_view(), name="captcha_dismiss"),
    re_path(r"^no-thanks/?$", DismissCaptchaView.as_view(), name="captcha_no_thanks"),
]
