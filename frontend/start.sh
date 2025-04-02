#!/bin/sh

# Initialize data directories
mkdir -p /app/debug-api/generated-artifacts/csvs
mkdir -p /app/debug-api/generated-artifacts/charts

# Create sample data for cities if they don't exist
for CITY in London Stockholm Toronto Moscow Madrid; do
  if [ ! -f /app/debug-api/generated-artifacts/csvs/$CITY.csv ]; then
    echo "city,temperature,timestamp" > /app/debug-api/generated-artifacts/csvs/$CITY.csv
    echo "$CITY,20.0,$(date -Iseconds)" >> /app/debug-api/generated-artifacts/csvs/$CITY.csv
  fi
done

# Start the FastAPI server in the background
cd /app
echo "Starting FastAPI server..."
python -m uvicorn debug-api.main:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

# Start Next.js server in the background
echo "Starting Next.js server..."
cd /app
node server.js &
NEXTJS_PID=$!

# Get container's hostname
HOSTNAME=$(hostname)

# Wait for both servers to be ready
echo "Waiting for servers to start..."
for i in $(seq 1 30); do
  # Check FastAPI health
  if curl -s http://0.0.0.0:8000/health >/dev/null; then
    FASTAPI_READY=1
  fi
  
  # Check Next.js
  if curl -s http://0.0.0.0:3001 >/dev/null; then
    NEXTJS_READY=1
  fi
  
  if [ "$FASTAPI_READY" = "1" ] && [ "$NEXTJS_READY" = "1" ]; then
    echo "Both servers are ready!"
    break
  fi
  
  echo "Waiting for servers... ($i/30)"
  sleep 2
done

# Function to check health of services
check_health() {
  # Check FastAPI health
  if ! curl -s http://0.0.0.0:8000/health >/dev/null; then
    echo "FastAPI health check failed!"
    return 1
  fi
  
  # Check Next.js is responding
  if ! curl -s http://0.0.0.0:3001 >/dev/null; then
    echo "Next.js health check failed!"
    return 1
  fi
  
  return 0
}

# Monitor health in a loop
while true; do
  if ! check_health; then
    echo "Health check failed, attempting to restart services..."
    
    # Try to restart FastAPI if it's down
    if ! kill -0 $FASTAPI_PID 2>/dev/null; then
      echo "Restarting FastAPI server..."
      cd /app
      python -m uvicorn debug-api.main:app --host 0.0.0.0 --port 8000 &
      FASTAPI_PID=$!
    fi
    
    # Try to restart Next.js if it's down
    if ! kill -0 $NEXTJS_PID 2>/dev/null; then
      echo "Restarting Next.js server..."
      cd /app
      node server.js &
      NEXTJS_PID=$!
    fi
  fi
  
  sleep 30
done 