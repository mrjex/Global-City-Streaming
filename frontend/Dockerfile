# Stage 1: Building the Next.js application
FROM node:18-alpine AS builder

# Add build dependencies
RUN apk add --no-cache \
    libc6-compat

WORKDIR /app

# Create public directory
RUN mkdir -p public

# Copy frontend package.json
COPY frontend/package.json ./
RUN npm install --production=false && \
    npm install --save-dev @types/node @types/js-yaml @types/fs-extra && \
    npm install chart.js@^4.0.0 react-chartjs-2@^5.0.0 && \
    npm install three @types/three

# Copy frontend source files
COPY frontend/ ./

# Copy shared directory for build time
COPY shared/ ./shared/

# Copy environment files
COPY frontend/.env.production ./.env.production

# Copy configuration
COPY configuration.yml /app/configuration.yml

# Set environment variables for better performance
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_IGNORE_TYPESCRIPT_ERRORS=true
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Build the application with output standalone
RUN npm run build

# Stage 2: Running the application
FROM node:18-alpine AS runner

WORKDIR /app

# Add runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    dos2unix \
    python3 \
    py3-pip

# Create a Python virtual environment and install dependencies
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install requests pyyaml

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/configuration.yml /app/configuration.yml

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV CITY_API_URL=http://city-api:8003
ENV PATH="/app/venv/bin:$PATH"

# Expose Next.js port
EXPOSE 3001

# Copy the start.sh file directly and fix line endings
COPY frontend/start.sh /app/start.sh
RUN dos2unix /app/start.sh
RUN chmod +x /app/start.sh

# Verify the script exists and is executable
RUN ls -la /app/start.sh

CMD ["/app/start.sh"] 