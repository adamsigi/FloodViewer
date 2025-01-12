
from django.contrib.auth import get_user_model
from users.tests.data import user_data, staff_user_data

User = get_user_model()

def create_user():
    User.objects.create_user(**user_data())

def create_staff_user():
    User.objects.create_user(**staff_user_data())
