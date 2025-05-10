# Terraform Module for DigitalOcean Droplet

This module provisions a DigitalOcean Droplet using the DigitalOcean Terraform provider.

## Providers
| Name         | Version    |
|--------------|------------|
| digitalocean | >= 2.0.0   |

## Requirements
| Name        | Version     |
|-------------|-------------|
| terraform   | >= 1.11.4   |
| doctl       | >= 1.125.1  |

## Inputs
| Name            | Description                        | Type   | Default              | Required |
|-----------------|------------------------------------|--------|----------------------|----------|
| do_token        | DigitalOcean API token              | string | n/a                  | yes      |
| droplet_name    | Name of the Droplet                | string | ubuntu-droplet-1     | no       |
| region          | DigitalOcean region                | string | fra1                 | no       |
| size            | Droplet size                       | string | s-1vcpu-2gb          | no       |
| image           | Droplet image slug                 | string | ubuntu-22-04-x64     | no       |
| ssh_fingerprint | SSH key fingerprint for access     | string | n/a                  | yes      |

## Outputs
| Name        | Description                  |
|-------------|-----------------------------|
| droplet_ip  | Public IPv4 address of Droplet |




