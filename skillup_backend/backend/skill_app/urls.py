from django.urls import path
from .views import SignupView, LoginView, SkillView

urlpatterns = [
    path('signup', SignupView.as_view(), name='signup'),
    path('login', LoginView.as_view(), name='login'),
    path('skill', SkillView.as_view(), name='skill'),
]