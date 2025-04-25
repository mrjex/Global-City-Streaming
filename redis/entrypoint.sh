#!/bin/sh

# Start Redis in the background with the original command line arguments
redis-server $@ &
REDIS_PID=$!

# Wait for Redis to be ready
until redis-cli ping > /dev/null 2>&1; do
  echo "Waiting for Redis to be ready..."
  sleep 1
done

echo "Redis is ready, checking if data should be loaded..."

# Check if we should load the static cities data
if [ "$LOAD_STATIC_CITIES" = "true" ]; then
  echo "LOAD_STATIC_CITIES is true, loading data..."
  
  # Check if the static-cities.json file exists
  if [ -f "/data/static-cities.json" ]; then
    python3 /app/load_to_redis.py
  else
    echo "Warning: /data/static-cities.json not found"
  fi
else
  echo "LOAD_STATIC_CITIES is not set to true, skipping data load"
fi

# Wait for Redis to exit
wait $REDIS_PID 