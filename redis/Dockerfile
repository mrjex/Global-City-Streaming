FROM redis:alpine

# Install Python and required packages
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .

# Install packages with the --break-system-packages flag
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the loader script
COPY load_to_redis.py .

# Add an entry point script that starts Redis and conditionally runs the loader
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"] 