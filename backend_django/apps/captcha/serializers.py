from django.utils import timezone
from rest_framework import serializers
from .models import CaptchaChallenge


class CurrentCaptchaSerializer(serializers.ModelSerializer):
    """
    Serializer strictly for the safe, public CAPTCHA challenge payload.
    NEVER exposes correct_option, result, reward, or server internals.
    """
    challengeId = serializers.UUIDField(source="challenge_id", read_only=True)
    question = serializers.CharField(source="captcha_text", read_only=True)
    options = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )
    expiresAt = serializers.DateTimeField(source="expires_at", read_only=True)
    timeRemainingSeconds = serializers.SerializerMethodField()

    class Meta:
        model = CaptchaChallenge
        fields = [
            "challengeId",
            "question",
            "options",
            "expiresAt",
            "timeRemainingSeconds",
        ]
        read_only_fields = fields

    def get_timeRemainingSeconds(self, obj):
        now = timezone.now()
        remaining = int((obj.expires_at - now).total_seconds())
        return max(0, remaining)


class VerifyCaptchaInputSerializer(serializers.Serializer):
    """
    Input serializer for POST /api/captcha/verify/.
    Accepts ONLY challengeId and selectedOption.
    Explicitly ignores any client-supplied reward, isCorrect, or userId.
    """
    challengeId = serializers.UUIDField(required=True)
    selectedOption = serializers.CharField(max_length=16, required=True, trim_whitespace=True)


class ChallengeActionInputSerializer(serializers.Serializer):
    """
    Input serializer for POST /api/captcha/claim/ and POST /api/captcha/dismiss/.
    """
    challengeId = serializers.UUIDField(required=True)
