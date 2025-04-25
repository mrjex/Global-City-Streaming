#!/bin/sh
set -e

# Check if we should load static city data
if [ "$LOAD_STATIC_CITIES" = "true" ]; then
  echo "Will load static city data to Redis after startup..."
  LOAD_DATA="yes"
else
  echo "Will NOT load static city data (LOAD_STATIC_CITIES is not set to 'true')"
  LOAD_DATA="no"
fi

# Function to load data into Redis
load_data() {
  echo "Loading static city data to Redis..."
  python3 /app/load_to_redis.py
  
  # Print Redis structure for verification
  python3 -c "
import sys, os
sys.path.append('/app')
import redis
import json

try:
    # Connect to Redis
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    # Print the current Redis structure
    print('Current Redis Keys:')
    for key in redis_client.keys('*'):
        key_type = redis_client.type(key)
        print(f'{key} ({key_type})')
        
    # Print sample static city data
    static_cities = redis_client.smembers('static:cities:all')
    if static_cities:
        sample_city = next(iter(static_cities))
        print(f'\\nSample static city ({sample_city}):')
        city_data = redis_client.hgetall(f'static:city:{sample_city}')
        print(json.dumps(city_data, indent=2))
    
    # Check for dynamic data
    if redis_client.exists('dynamic:countries:all'):
        print('\\nDynamic countries:')
        countries = redis_client.smembers('dynamic:countries:all')
        print(', '.join(countries))
except Exception as e:
    print(f'Error checking Redis structure: {str(e)}')
"
  echo "Static city data loaded successfully!"
}

# Start Redis in the foreground but load data in the background
if [ "$LOAD_DATA" = "yes" ]; then
  # Start Redis and load data in the background
  (
    # Wait for Redis to be fully up
    until redis-cli ping >/dev/null 2>&1; do
      sleep 1
    done
    
    # Load the data
    load_data
  ) &
fi

# Start Redis in foreground
echo "Starting Redis in foreground..."
exec redis-server --protected-mode no 