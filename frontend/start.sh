#!/bin/sh

# Start Next.js server in the background
echo "Starting Next.js server..."
cd /app
node server.js &
NEXTJS_PID=$!

# Function to check health of Next.js
check_health() {
  # Check Next.js is responding
  if ! curl -s http://0.0.0.0:3001 >/dev/null; then
    echo "Next.js health check failed!"
    return 1
  fi
  return 0
}

# Wait for server to be ready
echo "Waiting for Next.js server to start..."
for i in $(seq 1 30); do
  if curl -s http://0.0.0.0:3001 >/dev/null; then
    echo "Next.js server is ready!"
    break
  fi
  echo "Waiting for Next.js server... ($i/30)"
  sleep 2
done

# Monitor health in a loop
while true; do
  if ! check_health; then
    echo "Health check failed, attempting to restart Next.js..."
    
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