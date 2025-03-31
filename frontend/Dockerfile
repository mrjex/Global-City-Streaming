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
    pip3 install --no-cache-dir pandas plotly psycopg2-binary pyyaml matplotlib requests

WORKDIR /app

# Copy frontend package.json
COPY frontend/package.json ./
RUN npm install --production=false

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
    libjpeg

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . $VIRTUAL_ENV/bin/activate && \
    pip3 install --no-cache-dir pandas plotly psycopg2-binary pyyaml matplotlib requests

# Create necessary directories
RUN mkdir -p public /app/debug-api/generated-artifacts/csvs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/debug-api /app/debug-api/
COPY --from=builder /app/configuration.yml /app/configuration.yml

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1
ENV PYTHONPATH=/app/debug-api

EXPOSE 3000

# Use standalone output
CMD ["node", "server.js"] 