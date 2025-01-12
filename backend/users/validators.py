import re
from django.core.exceptions import ValidationError


class ComplexityValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.",
                                  code='password_no_upper')

        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter.",
                                  code='password_no_upper')

        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one number.",
                                  code='password_no_upper')

    def get_help_text(self):
        return "Password must contain at least one uppercase letter, one lowercase letter, and one number."


class SpecialCharactersValidator:
    def validate(self, password, user=None):
        if re.search(r'[^A-Za-z0-9@$!%*?&.,:;(){}\[\]<>|/\'"_+-=~^#]', password):
            raise ValidationError("Password can only contain letters, numbers, and the following special characters: @$!%*?&.,:;(){}[]<>|/'\"_+-=~^#",
                                  code='password_invalid_chars')

    def get_help_text(self):
        return "Password can only contain letters, numbers, and the following special characters: @$!%*?&.@$!%*?&.,:;(){}[]<>|/'\"_+-=~^#"
