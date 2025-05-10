

setEnvironmentVariables() {
    TOKEN_VALUE=${1}
    SSH_FINGERPRINT=${2}

    export TF_VAR_do_token=${TOKEN_VALUE}
    export TF_VAR_ssh_fingerprint=${SSH_FINGERPRINT}
}




## STEPS

# Find the Droplet ID
# doctl compute droplet list

# Import the Droplet into Terraform
# terraform import digitalocean_droplet.app_server <droplet_id>



initializeAndApply() {

    cd ../terraform

    terraform init
    terraform plan
    terraform apply
}


# doctl compute ssh-key list