#!/bin/bash

set -e

echo "Applying database migrations"
conda run -n floodpy_gpu python manage.py makemigrations
conda run -n floodpy_gpu python manage.py migrate

echo "Starting the application"
exec "$@"
