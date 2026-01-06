FROM python:3.11-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/data

# Railway sets PORT env var
CMD python -c "import os; import uvicorn; port = int(os.environ.get('PORT', 8000)); print(f'Starting on port {port}'); uvicorn.run('app.main:app', host='0.0.0.0', port=port)"
