#!/bin/bash

# chmod +x deploy.sh

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.yml -p global-city-streaming down

# Pull latest changes from git (assuming you're using git)
echo "Pulling latest changes..."
git pull origin main  # or your branch name

# Rebuild and start containers
echo "Rebuilding and starting containers..."
docker-compose -f docker-compose.yml -p global-city-streaming up --build -d

# Wait for containers to start
echo "Waiting for containers to start..."
# sleep 10

# Check container status
echo "Checking container status..."
docker ps

sudo systemctl reload nginx

echo "Deployment complete! Check logs with: docker-compose -f docker-compose.yml -p global-city-streaming logs -f"
