import logging
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class AppException(APIException):
    """Base application exception matching the reference AppError structure."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "APP_ERROR"
    default_detail = "An application error occurred."

    def __init__(self, message=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        self.code = code or self.default_code
        self.message = message or self.default_detail
        super().__init__(self.message)


class BadRequestException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "BAD_REQUEST"


class UnauthorizedException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = "AUTHENTICATION_REQUIRED"
    default_detail = "Authentication required"


class ForbiddenException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "ACCESS_FORBIDDEN"
    default_detail = "You do not have permission to perform this action"


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "RESOURCE_NOT_FOUND"
    default_detail = "Requested resource not found"


class ConflictException(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "RESOURCE_CONFLICT"
    default_detail = "A conflict occurred with the current state of the resource"


def standardized_exception_handler(exc, context):
    """
    Ensures all error responses strictly follow the reference API contract:
    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Description"
      }
    }
    """
    # Custom AppException subclasses
    if isinstance(exc, AppException):
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
            status=exc.status_code,
        )

    # Let DRF handle standard exceptions first to extract status_code
    response = exception_handler(exc, context)

    if response is not None:
        code = "API_ERROR"
        message = "An error occurred."

        if isinstance(exc, ValidationError):
            code = "VALIDATION_ERROR"
            # Format validation errors into a readable string
            if isinstance(response.data, dict):
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list) and len(first_val) > 0:
                    message = f"{first_key}: {first_val[0]}"
                else:
                    message = f"{first_key}: {first_val}"
            elif isinstance(response.data, list) and len(response.data) > 0:
                message = str(response.data[0])
            else:
                message = str(response.data)

        elif isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            code = "AUTHENTICATION_REQUIRED"
            message = getattr(exc, "detail", "Authentication required")
            if isinstance(message, dict) and "detail" in message:
                message = str(message["detail"])

        elif isinstance(exc, PermissionDenied):
            code = "ACCESS_FORBIDDEN"
            message = getattr(exc, "detail", "Permission denied")

        elif isinstance(exc, NotFound):
            code = "NOT_FOUND"
            message = getattr(exc, "detail", "Resource not found")

        elif isinstance(exc, MethodNotAllowed):
            code = "METHOD_NOT_ALLOWED"
            message = f"Method {context['request'].method} not allowed."

        elif isinstance(exc, Throttled):
            code = "RATE_LIMIT_EXCEEDED"
            message = f"Too many requests. Please try again in {exc.wait} seconds."

        else:
            if hasattr(exc, "detail"):
                message = str(exc.detail)

        return Response(
            {
                "success": False,
                "error": {
                    "code": code,
                    "message": str(message),
                },
            },
            status=response.status_code,
        )

    # Unhandled 500 exceptions
    logger.exception("Unhandled server exception: %s", exc)
    return Response(
        {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server.",
            },
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
