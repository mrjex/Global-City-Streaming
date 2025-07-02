#!/bin/bash


# Deploy on Digital Ocean Linux Droplet

connectSSH() {
    ssh root@209.97.176.90
}

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.yml -p global-city-streaming down

# Pull latest changes from git (assuming you're using git)
echo "Pulling latest changes..."
git pull origin main  # or your branch name

# Rebuild and start containers
echo "Rebuilding and starting containers..."
# docker-compose -f docker-compose.yml -p global-city-streaming up --build -d
docker compose -p global-city-streaming up -d --pull always

# Wait for containers to start
echo "Waiting for containers to start..."
# sleep 10

# Check container status
echo "Checking container status..."
docker ps

sudo systemctl reload nginx

echo "Deployment complete! Check logs with: docker-compose -f docker-compose.yml -p global-city-streaming logs -f"
