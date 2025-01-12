from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model, password_validation


class FloodViewerUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = get_user_model()
        fields = ["email",]

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords don't match")
        return password2

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email and get_user_model()._default_manager.filter(email=email).exists():
            raise ValidationError('Email already taken')
        return email

    def _post_clean(self):
        super()._post_clean()
        password = self.cleaned_data.get("password1")
        if password:
            try:
                password_validation.validate_password(password, self.instance)
            except ValidationError as error:
                self.add_error('password1', error)

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class FloodViewerUserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = get_user_model()
        fields = "__all__"


def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    password = self.fields.get("password")
    if password:
        if self.instance and not self.instance.has_usable_password():
            password.help_text = "Enable password-based authentication for this user by setting a password."

    user_permissions = self.fields.get("user_permissions")
    if user_permissions:
        user_permissions.queryset = user_permissions.queryset.select_related(
            "content_type"
        )
