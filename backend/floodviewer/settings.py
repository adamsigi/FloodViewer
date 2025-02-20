from pathlib import Path
from datetime import timedelta
from decouple import config
import os
import sys

# env vars
POSTGRES_DB = config('POSTGRES_DB')
POSTGRES_USER = config('POSTGRES_USER')
POSTGRES_PASSWORD = config('POSTGRES_PASSWORD')
POSTGRES_HOST = config('POSTGRES_HOST')
POSTGRES_PORT = config('POSTGRES_PORT')

REDIS_HOST = config('REDIS_HOST')
REDIS_PORT = config('REDIS_PORT', cast=int)

GEOSERVER_ADMIN_USER = config('GEOSERVER_ADMIN_USER')
GEOSERVER_ADMIN_PASSWORD = config('GEOSERVER_ADMIN_PASSWORD')
GEOSERVER_URL = config('GEOSERVER_URL')
GEOSERVER_DATA_PATH = config('GEOSERVER_DATA_PATH')
FRONTEND_DOMAIN = config('FRONTEND_DOMAIN')

WORKSPACE_PATH = config('WORKSPACE_PATH')
PRODUCTS_PATH = config('PRODUCTS_PATH')
FLOODPY_HOME = config('FLOODPY_HOME')
GPTBIN_PATH = config('GPTBIN_PATH')
SNAP_ORBIT_PATH = config('SNAP_ORBIT_PATH')
CDS_API_RC_PATH = config('CDS_API_RC_PATH')
CDSAPI_UID = config('CDSAPI_UID')
CDSAPI_KEY = config('CDSAPI_KEY')
COPERNICUS_USERNAME = config('COPERNICUS_USERNAME')
COPERNICUS_PASSWORD = config('COPERNICUS_PASSWORD')

SECRET_KEY = config("SECRET_KEY")  # SECURITY WARNING: keep the secret key used in production secret!
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="").split(",")
HTTPS_ONLY = config("HTTPS_ONLY", cast=bool)

# Prevent accidental behavior
DEBUG = config('DEBUG', cast=bool)
GHOST_MODE = config('GHOST_MODE', cast=bool)


FRONTEND_URL = ('http://' if DEBUG else 'https://') + FRONTEND_DOMAIN

BASE_DIR = Path(__file__).resolve().parent.parent



DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': POSTGRES_DB,
        'USER': POSTGRES_USER,
        'PASSWORD': POSTGRES_PASSWORD,
        'HOST': POSTGRES_HOST,
        'PORT': POSTGRES_PORT,
    }
}


THUMBNAIL_SIZE = 568  # number of pixels of the largest side of the thumbnail requested from geoserver
MAX_BBOX_SIDE_DISTANCE = 50
AUTH_USER_MODEL = 'users.FloodViewerUser'

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'corsheaders',
    'rest_framework',
    'django_filters',
    'djoser',
    'channels',
    'api',
    'users',
    'django_extensions',
]

if not DEBUG:
    # email credentials
    EMAIL_HOST = config('EMAIL_HOST')
    EMAIL_HOST_USER = config('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_USE_SSL = False
    # nginx header
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'webmaster@localhost'


CELERY_BROKER_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
CELERY_TASK_IGNORE_RESULT = True  # updates are sent manually in real time
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TASK_TIME_LIMIT = 3 * 60 * 60  # kill tasks after 3 hours

CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ['Set-Cookie']

SECURE_SSL_REDIRECT=HTTPS_ONLY
SESSION_COOKIE_SECURE=HTTPS_ONLY
CSRF_COOKIE_SECURE=HTTPS_ONLY
SECURE_HSTS_SECONDS = 0

PAGE_SIZE = 12

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'floodviewer.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = "floodviewer.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_HOST, REDIS_PORT)],
        },
    },
}

DEFAULT_RENDERER_CLASSES = (
    'rest_framework.renderers.JSONRenderer',
)

# Browser API interface is only available in debug
if DEBUG:
    DEFAULT_RENDERER_CLASSES = DEFAULT_RENDERER_CLASSES + (
        'rest_framework.renderers.BrowsableAPIRenderer',
    )

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': DEFAULT_RENDERER_CLASSES,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'floodmap_post': '20/day',
        'floodmap_get': '360/hour',
        'auth': '100/day',
    },
    'TEST_REQUEST_DEFAULT_FORMAT': 'json'
}

DJOSER = {
    'SEND_ACTIVATION_EMAIL': True,
    'ACTIVATION_URL': 'activation/{uid}/{token}',
    'PASSWORD_RESET_CONFIRM_URL': 'reset_password_confirm/{uid}/{token}',
    'PASSWORD_CHANGED_EMAIL_CONFIRMATION': True,
    'USER_CREATE_PASSWORD_RETYPE': True,
    'SET_PASSWORD_RETYPE': True,
    'EMAIL_FRONTEND_SITE_NAME': FRONTEND_DOMAIN,  # replaces site_name in emails
    'EMAIL_FRONTEND_DOMAIN': FRONTEND_DOMAIN,
    'EMAIL_FRONTEND_PROTOCOL': 'https',
    'EMAIL': {
        'activation': 'users.emails.MyActivationEmail',
        'password_reset': 'users.emails.MyPasswordResetEmail',
        'password_changed_confirmation': 'users.emails.MyPasswordChangedConfirmationEmail',
    },
    'PASSWORD_RESET_SHOW_EMAIL_NOT_FOUND': True,
    'TOKEN_MODEL': None,  # JWT is used
}

SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('JWT',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=20),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'AUTH_TOKEN_CLASSES': ('users.token.EnhancedAccessToken',),
    'AUTH_COOKIE_NAME': 'refresh_token',  # Custom
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}',
        'TIMEOUT': 180,
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'users.validators.ComplexityValidator'
    },
    {
        'NAME': 'users.validators.SpecialCharactersValidator'
    }
]

CELERYD_HIJACK_ROOT_LOGGER = False

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "context": {
            "format": "[{levelname} {asctime} {module} {process:d}] {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "context"
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },
}

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Overrides during testing.
if "test" in sys.argv:
    # Ensure proper mode is set.
    DEBUG = True
    GHOST_MODE = True

    # No throttling
    REST_FRAMEWORK = {
        'DEFAULT_RENDERER_CLASSES': DEFAULT_RENDERER_CLASSES,
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        ],
        'TEST_REQUEST_DEFAULT_FORMAT': 'json'
    }
    
    # Debug logs (off by default)
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "context": {
                "format": "[{levelname} {asctime} {module} {process:d}] {message}",
                "style": "{",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "context"
            },
            "null": {
                "class": "logging.NullHandler",
            },
        },
        "root": {
            "handlers": ["null"],
            "level": "DEBUG",
        },
        "loggers": {
            "django.request": {
                "handlers": ["null"],
                "level": "DEBUG",
                "propagate": False,
            },
            "django.security": {
                "handlers": ["null"],
                "level": "DEBUG",
                "propagate": False,
            },
            "celery": {
                "handlers": ["null"],
                "level": "DEBUG",
            },
        },
    }
