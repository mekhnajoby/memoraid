#!/usr/bin/env bash
# Render Build Script for Memoraid Backend
# This script is executed by Render during each deploy.

set -o errexit  # exit on error

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate
