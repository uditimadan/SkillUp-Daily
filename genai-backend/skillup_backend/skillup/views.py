from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserSerializer
import openai

openai.api_key = settings.OPENAI_API_KEY

class SignupView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)

class SkillView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        age_group = request.GET.get('age_group', 'kids')
        
        prompt = self.get_prompt_for_age_group(age_group)
        
        try:
            response = openai.Completion.create(
                engine="text-davinci-002",
                prompt=prompt,
                max_tokens=50,
                n=1,
                stop=None,
                temperature=0.7,
            )
            
            skill = response.choices[0].text.strip()
            return Response({'skill': skill})
        except Exception as e:
            print(f"Error calling OpenAI API: {str(e)}")
            return Response({'error': 'Failed to generate skill'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_prompt_for_age_group(self, age_group):
        if age_group == 'kids':
            return "Generate a simple, fun skill for a child to learn today:"
        elif age_group == 'teens':
            return "Suggest an interesting skill for a teenager to learn today:"
        else:  # adults
            return "Recommend a practical or enriching skill for an adult to learn today:"
