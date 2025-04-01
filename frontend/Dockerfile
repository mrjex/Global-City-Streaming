# Stage 1: Building the Next.js application
FROM node:18-alpine AS builder

# Add build dependencies including Python
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    py3-pip \
    gcc \
    musl-dev \
    python3-dev \
    postgresql-dev \
    freetype-dev \
    jpeg-dev \
    zlib-dev \
    libjpeg

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . $VIRTUAL_ENV/bin/activate && \
    pip3 install --no-cache-dir pandas plotly psycopg2-binary pyyaml matplotlib requests docker fastapi uvicorn

WORKDIR /app

# Copy frontend package.json
COPY frontend/package.json ./
RUN npm install --production=false && \
    npm install --save-dev @types/node

# Copy frontend source files
COPY frontend/ ./

# Copy debug-api and configuration
COPY debug-api/ /app/debug-api/
COPY configuration.yml /app/configuration.yml
COPY utils.py /app/debug-api/utils.py

# Create necessary directories
RUN mkdir -p public /app/debug-api/generated-artifacts/csvs

# Set environment variables for better performance
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PYTHONPATH=/app/debug-api

# Build the application
RUN npm run build

# Stage 2: Running the application
FROM node:18-alpine AS runner

WORKDIR /app

# Add runtime dependencies including Python
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    py3-pip \
    gcc \
    musl-dev \
    python3-dev \
    postgresql-dev \
    freetype-dev \
    jpeg-dev \
    zlib-dev \
    libjpeg \
    curl

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . $VIRTUAL_ENV/bin/activate && \
    pip3 install --no-cache-dir pandas plotly psycopg2-binary pyyaml matplotlib requests docker fastapi uvicorn

# Create necessary directories
RUN mkdir -p public /app/debug-api/generated-artifacts/csvs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/debug-api /app/debug-api/
COPY --from=builder /app/configuration.yml /app/configuration.yml

# Create a valid configuration file
RUN echo 'debugApi:' > /app/configuration.yml && \
    echo '  citiesPool:' >> /app/configuration.yml && \
    echo '  - London' >> /app/configuration.yml && \
    echo '  - Stockholm' >> /app/configuration.yml && \
    echo '  - Toronto' >> /app/configuration.yml && \
    echo '  - Moscow' >> /app/configuration.yml && \
    echo '  - Madrid' >> /app/configuration.yml && \
    echo '  - Reykjavik' >> /app/configuration.yml && \
    echo '  - Helsinki' >> /app/configuration.yml && \
    echo '  - Rome' >> /app/configuration.yml && \
    echo '  - Venice' >> /app/configuration.yml && \
    echo '  - Lisbon' >> /app/configuration.yml && \
    echo '  - Paris' >> /app/configuration.yml && \
    echo '  - Amsterdam' >> /app/configuration.yml && \
    echo '  queryConfig:' >> /app/configuration.yml && \
    echo '    queryAttribute: continent' >> /app/configuration.yml && \
    echo '    queryRequirement: Europe' >> /app/configuration.yml && \
    echo '  charts:' >> /app/configuration.yml && \
    echo '    bubbleChart:' >> /app/configuration.yml && \
    echo '      separateGraphDisplay: False' >> /app/configuration.yml && \
    echo '      bubbleColorTheme: brown' >> /app/configuration.yml && \
    echo '      pngOutput: True' >> /app/configuration.yml && \
    echo '    pieChart:' >> /app/configuration.yml && \
    echo '      chartType: Color-Theme' >> /app/configuration.yml && \
    echo '      pieColorTheme: orange' >> /app/configuration.yml && \
    echo '      pngOutput: True' >> /app/configuration.yml && \
    echo '    equatorChart:' >> /app/configuration.yml && \
    echo '      displayLinearTrend: False' >> /app/configuration.yml && \
    echo '      displayLogarithmicTrend: True' >> /app/configuration.yml && \
    echo '      displayActualTrend: False' >> /app/configuration.yml && \
    echo '      pngOutput: True' >> /app/configuration.yml && \
    echo '' >> /app/configuration.yml && \
    echo 'realTimeProduction:' >> /app/configuration.yml && \
    echo '  cities:' >> /app/configuration.yml && \
    echo '  - London' >> /app/configuration.yml && \
    echo '  - Stockholm' >> /app/configuration.yml && \
    echo '  - Toronto' >> /app/configuration.yml && \
    echo '  - Moscow' >> /app/configuration.yml && \
    echo '  - Madrid' >> /app/configuration.yml

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1
ENV PYTHONPATH=/app/debug-api

EXPOSE 3000

# Create FastAPI app if it doesn't exist
RUN mkdir -p /app/debug-api
RUN echo 'from fastapi import FastAPI' > /app/debug-api/main.py && \
    echo 'from fastapi.middleware.cors import CORSMiddleware' >> /app/debug-api/main.py && \
    echo 'import os' >> /app/debug-api/main.py && \
    echo 'import json' >> /app/debug-api/main.py && \
    echo 'import requests' >> /app/debug-api/main.py && \
    echo '' >> /app/debug-api/main.py && \
    echo 'app = FastAPI()' >> /app/debug-api/main.py && \
    echo '' >> /app/debug-api/main.py && \
    echo 'app.add_middleware(' >> /app/debug-api/main.py && \
    echo '    CORSMiddleware,' >> /app/debug-api/main.py && \
    echo '    allow_origins=["*"],' >> /app/debug-api/main.py && \
    echo '    allow_credentials=True,' >> /app/debug-api/main.py && \
    echo '    allow_methods=["*"],' >> /app/debug-api/main.py && \
    echo '    allow_headers=["*"],' >> /app/debug-api/main.py && \
    echo ')' >> /app/debug-api/main.py && \
    echo '' >> /app/debug-api/main.py && \
    echo '@app.get("/api/kafka-logs")' >> /app/debug-api/main.py && \
    echo 'async def get_kafka_logs():' >> /app/debug-api/main.py && \
    echo '    try:' >> /app/debug-api/main.py && \
    echo '        # This endpoint can still be implemented with the docker client as before' >> /app/debug-api/main.py && \
    echo '        import docker' >> /app/debug-api/main.py && \
    echo '        client = docker.from_env()' >> /app/debug-api/main.py && \
    echo '        container = client.containers.get("kafka-producer")' >> /app/debug-api/main.py && \
    echo '        logs = container.logs(tail=1000).decode("utf-8")' >> /app/debug-api/main.py && \
    echo '        return {"logs": logs}' >> /app/debug-api/main.py && \
    echo '    except Exception as e:' >> /app/debug-api/main.py && \
    echo '        print(f"Error fetching Kafka logs: {str(e)}")' >> /app/debug-api/main.py && \
    echo '        return {"error": str(e)}' >> /app/debug-api/main.py && \
    echo '' >> /app/debug-api/main.py && \
    echo '# Health check endpoint' >> /app/debug-api/main.py && \
    echo '@app.get("/health")' >> /app/debug-api/main.py && \
    echo 'async def health_check():' >> /app/debug-api/main.py && \
    echo '    return {"status": "healthy"}' >> /app/debug-api/main.py

# Create start script with simplified health check
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting FastAPI server..."' >> /start.sh && \
    echo 'cd /app/debug-api' >> /start.sh && \
    echo 'uvicorn main:app --host 0.0.0.0 --port 8000 &' >> /start.sh && \
    echo 'echo "Starting Next.js server..."' >> /start.sh && \
    echo 'cd /app' >> /start.sh && \
    echo 'node server.js &' >> /start.sh && \
    echo 'echo "Services started, waiting for them to complete"' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

# Use start script
CMD ["/start.sh"] 