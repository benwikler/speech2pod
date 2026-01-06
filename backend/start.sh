#!/bin/bash
echo "=== Starting Speech2Pod ===" >&2
echo "PORT=$PORT" >&2
echo "Working directory: $(pwd)" >&2
echo "Python version: $(python --version)" >&2
echo "Files in /app:" >&2
ls -la /app >&2

PORT=${PORT:-8000}
echo "Starting uvicorn on port $PORT" >&2

exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
