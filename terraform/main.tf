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
  name   = "ubuntu-droplet-1"
  region = "fra1"
  size   = "s-1vcpu-2gb"
  image  = "ubuntu-22-04-x64"
  ssh_keys = [var.ssh_fingerprint]
}