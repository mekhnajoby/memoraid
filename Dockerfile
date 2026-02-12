FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY projectmemoraid/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code to the workdir
COPY projectmemoraid/backend /app

ENV PORT 8000

# Run collectstatic (will use the paths relative to /app)
RUN python manage.py collectstatic --noinput || true

# Make entrypoint.sh executable
RUN chmod +x entrypoint.sh

# Use entrypoint.sh to run migrations and start the server
CMD ["./entrypoint.sh"]
