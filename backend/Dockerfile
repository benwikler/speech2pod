FROM python:3.11-slim

WORKDIR /app

# Install only fastapi and uvicorn
RUN pip install --no-cache-dir fastapi uvicorn

COPY app/main.py app/main.py

CMD ["sh", "-c", "python -c \"import os; port=int(os.environ.get('PORT',8000)); print(f'Port: {port}'); import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=port)\""]
