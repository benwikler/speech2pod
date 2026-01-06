FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory and make start script executable
RUN mkdir -p /app/data && chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Run uvicorn with Python reading PORT env var
CMD ["python", "-c", "import os; import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))"]
