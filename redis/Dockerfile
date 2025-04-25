FROM redis:alpine

# Install Python and required packages
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy all necessary files
COPY requirements.txt /app/
COPY load_to_redis.py /app/
COPY entrypoint.sh /app/

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages -r /app/requirements.txt

# Use shell form for entrypoint to ensure path resolution works properly
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"] 