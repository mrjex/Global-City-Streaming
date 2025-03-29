# Stage 1: Building the Next.js application
FROM node:18-alpine AS builder

# Add build dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json ./
RUN npm install --production=false

# Copy source files
COPY . .

# Create necessary directories
RUN mkdir -p public

# Set environment variables for better performance
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Stage 2: Running the application
FROM node:18-alpine AS runner

WORKDIR /app

# Add runtime dependencies
RUN apk add --no-cache libc6-compat

# Create necessary directories
RUN mkdir -p public

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

# Use standalone output
CMD ["node", "server.js"] 