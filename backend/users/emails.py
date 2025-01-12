from djoser.email import ActivationEmail, ConfirmationEmail, PasswordResetEmail, PasswordChangedConfirmationEmail

class MyActivationEmail(ActivationEmail):
    template_name = 'emails/activation.html'
class MyConfirmationEmail(ConfirmationEmail):
    template_name = 'emails/confirmation.html'
class MyPasswordResetEmail(PasswordResetEmail):
    template_name = 'emails/password_reset.html'
class MyPasswordChangedConfirmationEmail(PasswordChangedConfirmationEmail):
    template_name = 'emails/password_changed_confirmation.html'
