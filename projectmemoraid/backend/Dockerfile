FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev gcc default-libmysqlclient-dev pkg-config && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT 8000

RUN python manage.py collectstatic --noinput || true

# Make entrypoint.sh executable
RUN chmod +x entrypoint.sh

# Use entrypoint.sh to run migrations and start the server
CMD ["./entrypoint.sh"]
