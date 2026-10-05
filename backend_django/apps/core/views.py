from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status


class HealthCheckView(APIView):
    """
    Public health check endpoint matching the Node.js API specification.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "success": True,
                "message": "VELoop Rewards backend is running",
            },
            status=status.HTTP_200_OK,
        )
