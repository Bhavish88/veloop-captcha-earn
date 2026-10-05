from django.urls import re_path
from .views import HealthCheckView

urlpatterns = [
    re_path(r"^health/?$", HealthCheckView.as_view(), name="health_check"),
]
