from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .gemini_service import GeminiService
from .models import AIRequestLog

class ChatAssistantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        prompt = request.data.get('prompt', '').strip()
        language = request.data.get('language', 'en')
        if not prompt:
            return Response({"error": "Prompt cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Basic prompt injection filter
        sanitized_prompt = prompt[:1000]

        result = GeminiService.chat_assistant(sanitized_prompt, language)

        # Log request
        user = request.user if request.user.is_authenticated else None
        AIRequestLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            feature='assistant_chat',
            model_name='gemini-2.5-flash',
            success='error' not in result
        )

        return Response(result)

class WastePhotoIdentificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        photo_file = request.FILES.get('photo')
        language = request.data.get('language', 'en')

        if not photo_file:
            return Response({"error": "Please provide an image file."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (max 8MB)
        if photo_file.size > 8 * 1024 * 1024:
            return Response({"error": "Image file too large (max 8MB)."}, status=status.HTTP_400_BAD_REQUEST)

        image_bytes = photo_file.read()
        mime_type = photo_file.content_type or 'image/jpeg'

        result = GeminiService.identify_waste_photo(image_bytes, mime_type, language)

        user = request.user if request.user.is_authenticated else None
        AIRequestLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            feature='waste_identification',
            model_name='gemini-2.5-flash',
            success='error' not in result
        )

        return Response(result)

class SmartScrapEstimatorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        description = request.data.get('description', '')
        photo_file = request.FILES.get('photo')

        image_bytes = photo_file.read() if photo_file else None
        mime_type = photo_file.content_type if photo_file else 'image/jpeg'

        result = GeminiService.estimate_scrap_price(description, image_bytes, mime_type)

        user = request.user if request.user.is_authenticated else None
        AIRequestLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            feature='scrap_estimator',
            model_name='gemini-2.5-flash',
            success=True
        )

        return Response(result)

class RulesAssistantQAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        question = request.data.get('question', '').strip()
        language = request.data.get('language', 'en')
        if not question:
            return Response({"error": "Question is required."}, status=status.HTTP_400_BAD_REQUEST)

        result = GeminiService.answer_rules_qa(question[:500], language)

        user = request.user if request.user.is_authenticated else None
        AIRequestLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            feature='rules_qa',
            model_name='gemini-2.5-flash',
            success=True
        )

        return Response(result)
