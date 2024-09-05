# models.py
from django.db import models
from django.contrib.auth.models import User

class Skill(models.Model):
    AGE_GROUPS = [
        ('kids', 'Kids'),
        ('teens', 'Teens'),
        ('adults', 'Adults'),
    ]
    name = models.CharField(max_length=255)
    age_group = models.CharField(max_length=10, choices=AGE_GROUPS)

    def __str__(self):
        return self.name