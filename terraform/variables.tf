variable "do_token" {
  description = "The DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "ssh_fingerprint" {
  description = "The SSH key fingerprint for DigitalOcean"
  type        = string
}