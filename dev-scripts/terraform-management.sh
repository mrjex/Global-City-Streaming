##  TERRAFORM MANAGEMENT  ##
#
#   - This script takes two arguments: The access token from Digital Ocean and the fingerprint of the SSH key



setEnvironmentVariables() {
    TOKEN_VALUE=${1}
    SSH_FINGERPRINT=${2}

    export TF_VAR_do_token=${TOKEN_VALUE}
    export TF_VAR_ssh_fingerprint=${SSH_FINGERPRINT}
}

initializeAndApply() {
    terraform init
    terraform plan
    terraform apply
}


destroyInfrastructure() {
    terraform destroy
}



##  MAIN  ##


setEnvironmentVariables ${1} ${2}

cd ../terraform
initializeAndApply

# destroyInfrastructure