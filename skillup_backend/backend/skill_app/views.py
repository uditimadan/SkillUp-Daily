from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserSerializer
from openai import OpenAI

client = OpenAI(api_key=settings.OPENAI_API_KEY)

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
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that suggests skills to learn."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50
            )
            
            skill = response.choices[0].message.content.strip()
            return Response({'skill': skill})
        except Exception as e:
            print(f"Error calling OpenAI API: {str(e)}")
            return Response({'error': 'Failed to generate skill'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_prompt_for_age_group(self, age_group):
        if age_group == 'kids':
            return """
        Generate a heading and a descriptive paragraph in 2-3 lines for a fun and simple skill or 
        hobby suitable for children aged 5-12. The description should highlight the benefits, 
        such as improving fine motor skills, fostering creativity, or e
        ncouraging physical activity. It should also emphasize how the activity can be 
        enjoyable and engaging for children, making it easy for parents to facilitate and
        children to look forward to. Please do this in 2-3 lines.
        """
        elif age_group == 'teens':
            return """Suggest a heading and a descriptive paragraph for an engaging and interesting skill 
            or hobby that would appeal to teenagers aged 13-18. in 2-3 lines
              The description should explain how the skill can be beneficial in terms of personal growth, 
              social interaction, or academic enhancement. It should also address how the activity can be fun, 
              build self-confidence, and provide a productive outlet for their energy and creativity
              .Please do this in 2-3 lines."""
        else:  # adults
            return """Recommend a heading and a descriptive paragraph in 2-3 lines for a practical or enriching skill or hobby suitable for adults. 
            The description should emphasize the value of the activity in terms of personal development, relaxation, or practical benefits. 
            It should also highlight how the skill can enhance daily life, reduce stress, or provide a sense of accomplishment,
              making it a worthwhile and enjoyable pursuit for adults in their busy lives.Please do this in 2-3 lines."""