from rest_framework.renderers import JSONRenderer


class StandardizedJSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that ensures all successful responses are enveloped
    into the standard contract:
    {
      "success": true,
      "data": ...
    }
    Responses already containing "success" are passed through unmodified.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        status_code = None
        if renderer_context:
            status_code = renderer_context.get("response").status_code

        # If data is already properly formatted with "success", don't re-envelope
        if isinstance(data, dict) and "success" in data:
            return super().render(data, accepted_media_type, renderer_context)

        # Successful HTTP status
        if status_code is not None and 200 <= status_code < 400:
            formatted_data = {
                "success": True,
                "data": data,
            }
            return super().render(formatted_data, accepted_media_type, renderer_context)

        # Fallback for errors not caught by exception_handler
        if status_code is not None and status_code >= 400:
            formatted_data = {
                "success": False,
                "error": {
                    "code": "ERROR",
                    "message": str(data),
                },
            }
            return super().render(formatted_data, accepted_media_type, renderer_context)

        return super().render(data, accepted_media_type, renderer_context)
