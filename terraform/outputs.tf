output "droplet_ip" {
  value = digitalocean_droplet.app_server.ipv4_address
}