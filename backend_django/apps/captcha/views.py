from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    get_or_create_current_challenge,
    verify_captcha_challenge,
    claim_captcha_challenge,
    dismiss_captcha_challenge,
)
from .serializers import (
    CurrentCaptchaSerializer,
    VerifyCaptchaInputSerializer,
    ChallengeActionInputSerializer,
)


class CurrentCaptchaView(APIView):
    """
    GET /api/captcha/current/
    Returns the authenticated user's active pending CAPTCHA challenge.
    If none exists or current has expired, a new challenge is generated.
    Strictly isolated per user; never trusts client-provided user IDs.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = "captcha_current"

    def get(self, request):
        challenge = get_or_create_current_challenge(request.user)
        serializer = CurrentCaptchaSerializer(challenge)
        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class VerifyCaptchaView(APIView):
    """
    POST /api/captcha/verify/
    Verifies user's CAPTCHA answer and credits rewards atomically.
    The backend is the sole authority; client-provided rewards or isCorrect are ignored.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = "captcha_verify"

    def post(self, request):
        serializer = VerifyCaptchaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge_id = serializer.validated_data["challengeId"]
        selected_option = serializer.validated_data["selectedOption"]

        ip_address = request.META.get("REMOTE_ADDR")
        challenge = verify_captcha_challenge(
            user=request.user,
            challenge_id=challenge_id,
            selected_option=selected_option,
            ip_address=ip_address,
        )

        return Response(
            {
                "success": True,
                "data": {
                    "challengeId": str(challenge.challenge_id),
                    "result": challenge.result,
                    "reward": str(challenge.reward_amount),
                    "status": challenge.status,
                },
            },
            status=status.HTTP_200_OK,
        )


class ClaimCaptchaView(APIView):
    """
    POST /api/captcha/claim/
    Completes mock-rewarded ad claim flow and transitions challenge to CLAIMED.
    NEVER credits additional Gems.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChallengeActionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge_id = serializer.validated_data["challengeId"]

        challenge = claim_captcha_challenge(
            user=request.user,
            challenge_id=challenge_id,
        )

        return Response(
            {
                "success": True,
                "data": {
                    "challengeId": str(challenge.challenge_id),
                    "status": challenge.status,
                },
            },
            status=status.HTTP_200_OK,
        )


class DismissCaptchaView(APIView):
    """
    POST /api/captcha/dismiss/ (and POST /api/captcha/no-thanks/)
    Transitions challenge to DISMISSED.
    NEVER modifies wallet balance or creates ledger entries.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChallengeActionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge_id = serializer.validated_data["challengeId"]

        challenge = dismiss_captcha_challenge(
            user=request.user,
            challenge_id=challenge_id,
        )

        return Response(
            {
                "success": True,
                "data": {
                    "challengeId": str(challenge.challenge_id),
                    "status": challenge.status,
                },
            },
            status=status.HTTP_200_OK,
        )
