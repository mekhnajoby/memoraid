FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT 8000

RUN python manage.py collectstatic --noinput || true

CMD ["gunicorn", "memoraid_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
