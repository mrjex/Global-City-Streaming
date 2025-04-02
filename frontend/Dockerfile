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
    npm install --save-dev @types/node @types/js-yaml @types/fs-extra

# Copy frontend source files
COPY frontend/ ./

# Copy environment files
COPY frontend/.env.production ./.env.production

# Copy debug-api and configuration
COPY debug-api/ /app/debug-api/
COPY configuration.yml /app/configuration.yml
COPY utils.py /app/debug-api/utils.py

# Create necessary directories
RUN mkdir -p public /app/debug-api/generated-artifacts/csvs /app/debug-api/chart-helpers

# Set environment variables for better performance
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PYTHONPATH=/app/debug-api
ENV NEXT_IGNORE_TYPESCRIPT_ERRORS=true
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Build the application with output standalone
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

# Install Docker CLI
RUN apk add --no-cache docker-cli

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . $VIRTUAL_ENV/bin/activate && \
    pip3 install --no-cache-dir pandas plotly psycopg2-binary pyyaml matplotlib requests docker fastapi uvicorn

# Create necessary directories
RUN mkdir -p public /app/debug-api/generated-artifacts/csvs /app/debug-api/chart-helpers

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
    echo '  - Madrid' >> /app/configuration.yml

# Create FastAPI app
RUN mkdir -p /app/debug-api
COPY debug-api/main.py /app/debug-api/main.py

# Create data processor script
COPY debug-api/chart-helpers/data_processor.py /app/debug-api/chart-helpers/data_processor.py

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHONPATH=/app/debug-api

# Expose both FastAPI and Next.js ports
EXPOSE 8000
EXPOSE 3001

# Create start script
COPY frontend/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"] 