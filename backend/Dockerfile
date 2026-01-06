FROM python:3.11-slim

# Install ffmpeg for audio processing
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .
RUN mkdir -p /app/data

# Start command - Railway injects PORT
CMD ["sh", "-c", "python -c \"import os; port=int(os.environ.get('PORT',8000)); print(f'Starting on port {port}'); import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=port)\""]
