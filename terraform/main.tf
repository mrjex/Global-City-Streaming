terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}


resource "digitalocean_droplet" "app_server" {
  name   = "global-city-droplet"
  region = "nyc3" # or your preferred region
  size   = "s-1vcpu-1gb"
  image  = "ubuntu-22-04-x64"
}