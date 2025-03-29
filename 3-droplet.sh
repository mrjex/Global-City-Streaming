# 1. Create a small Droplet on DigitalOcean
# - Choose Ubuntu as OS
# - Select Basic plan ($5-10/month is fine for demo)
# - Choose a datacenter region
# - Add your SSH key

# 2. SSH into your Droplet
ssh root@your-droplet-ip

# 3. Clone your repository
git clone https://github.com/your-username/Global-City-Streaming.git
cd Global-City-Streaming

# 4. Start the services
docker-compose up -d

# 5. Configure domain (in DigitalOcean dashboard)
# - Add an A record pointing to your Droplet's IP