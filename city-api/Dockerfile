FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    python3-dev \
    dos2unix \
    curl \
    jq \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && wget https://github.com/mikefarah/yq/releases/download/v4.40.5/yq_linux_amd64 -O /usr/bin/yq \
    && chmod +x /usr/bin/yq

WORKDIR /app

# Copy requirements first and install all Python dependencies at once
COPY city-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY city-api/ .
COPY configuration.yml .

# Create necessary directories
RUN mkdir -p \
    city-api/generated-artifacts/csvs \
    city-api/generated-artifacts/charts \
    city-api/chart-helpers \
    city-api/apis/database \
    city-api/apis/database/logs

# Set environment variables
ENV PYTHONPATH=/app/city-api
ENV PORT=8003

# Expose the FastAPI port
EXPOSE 8003

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"] 