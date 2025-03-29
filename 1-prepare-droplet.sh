# Basic Ubuntu Droplet setup script
#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install docker-compose -y

# Install nginx (for web server)
apt-get install nginx -y

# Create directory for application
mkdir -p /var/www/global-city-streaming