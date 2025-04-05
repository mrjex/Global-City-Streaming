FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    python3-dev \
    dos2unix \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY city-api/apis/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install additional dependencies needed for charts
RUN pip install --no-cache-dir \
    pandas \
    plotly \
    psycopg2-binary \
    pyyaml \
    matplotlib \
    requests \
    docker \
    fastapi \
    uvicorn \
    statsmodels \
    scipy

# Copy city-api files
COPY city-api/ ./city-api/
COPY configuration.yml ./configuration.yml
COPY utils.py ./utils.py

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
CMD ["uvicorn", "city-api.main:app", "--host", "0.0.0.0", "--port", "8003"] 