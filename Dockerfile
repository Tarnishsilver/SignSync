# Use Python 3.11 slim — compatible with mediapipe + tensorflow
FROM python:3.11-slim

# System deps for OpenCV headless + mediapipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libgles2 \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and model assets
COPY sign_server.py .
COPY label_utils.py .
COPY hand_landmarker.task .
COPY model/ ./model/

# Expose WebSocket/HTTP port (Railway overrides with $PORT at runtime)
EXPOSE 8765

# Shell form so $PORT env var is expanded by the shell at runtime
CMD uvicorn sign_server:app --host 0.0.0.0 --port ${PORT:-8765}
