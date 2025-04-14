#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get service details
SERVICE_NAME="city-api"
NAMESPACE="global-city-streaming"

echo "Fetching service details for ${SERVICE_NAME}..."
CLUSTER_IP=$(kubectl get service ${SERVICE_NAME} -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
PORT=$(kubectl get service ${SERVICE_NAME} -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}')

if [ -z "$CLUSTER_IP" ] || [ -z "$PORT" ]; then
    echo -e "${RED}Failed to get service details${NC}"
    exit 1
fi

echo -e "${GREEN}Service IP: ${CLUSTER_IP}${NC}"
echo -e "${GREEN}Service Port: ${PORT}${NC}"

# Base URL for the API
BASE_URL="http://${CLUSTER_IP}:${PORT}"

echo -e "\nTesting health endpoint..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
if [ "$HEALTH_RESPONSE" == '{"status":"healthy"}' ]; then
    echo -e "${GREEN}Health check successful!${NC}"
else
    echo -e "${RED}Health check failed. Response: ${HEALTH_RESPONSE}${NC}"
fi

echo -e "\nTesting temperature endpoint..."
TEMP_DATA='{
    "city": "Stockholm",
    "country": "SE",
    "temperature": 20.5,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}'

echo "Sending data: ${TEMP_DATA}"
TEMP_RESPONSE=$(curl -s -X POST "${BASE_URL}/temperature" \
    -H "Content-Type: application/json" \
    -d "${TEMP_DATA}")

if [[ "$TEMP_RESPONSE" == *"success"* ]]; then
    echo -e "${GREEN}Temperature data sent successfully!${NC}"
else
    echo -e "${RED}Failed to send temperature data. Response: ${TEMP_RESPONSE}${NC}"
fi

# Port-forward to make the service accessible locally (optional)
echo -e "\nWould you like to set up port-forwarding to access the API documentation? (y/n)"
read -r SETUP_PORT_FORWARD

if [[ "$SETUP_PORT_FORWARD" == "y" ]]; then
    echo "Setting up port-forward..."
    echo "Access the API documentation at http://localhost:${PORT}/docs"
    echo "Press Ctrl+C to stop port-forwarding"
    kubectl port-forward -n ${NAMESPACE} service/${SERVICE_NAME} ${PORT}:${PORT}
fi 