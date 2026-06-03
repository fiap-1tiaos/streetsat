FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libgeos-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY dashboard/ ./dashboard/
COPY aws/ ./aws/
COPY scripts/ ./scripts/
COPY models/ ./models/

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000 5000

CMD ["sh", "-c", "uvicorn src.api.fastapi_app:app --host 0.0.0.0 --port 8000 & python dashboard/app.py"]
