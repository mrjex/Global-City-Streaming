#!/bin/bash

# Set error handling
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of Global City Streaming to Kubernetes...${NC}"

# Create namespace first
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Create ConfigMaps and Secrets
echo -e "${YELLOW}Creating ConfigMaps and Secrets...${NC}"
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/app-config-yml.yaml
kubectl apply -f k8s/shared-files-configmap.yaml
kubectl apply -f k8s/api-keys-secret.yaml

# Wait for ConfigMaps to be created
echo -e "${YELLOW}Waiting for ConfigMaps to be created...${NC}"
sleep 2

# Deploy StatefulSets (Kafka, Zookeeper, PostgreSQL)
echo -e "${YELLOW}Deploying StatefulSets (Kafka, Zookeeper, PostgreSQL)...${NC}"
kubectl apply -f k8s/kafka-zk-statefulset.yaml
kubectl apply -f k8s/postgres-statefulset.yaml

# Wait for StatefulSets to be ready
echo -e "${YELLOW}Waiting for StatefulSets to initialize...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
echo -e "${YELLOW}Checking status every 10 seconds...${NC}"

# Define the function to check if pods are ready
check_pods_ready() {
  namespace="global-city-streaming"
  pattern=$1
  ready=false
  
  while [ "$ready" != "true" ]; do
    # Get the list of pods matching the pattern
    pods=$(kubectl get pods -n $namespace | grep $pattern | awk '{print $1}')
    
    if [ -z "$pods" ]; then
      echo -e "${RED}No pods found matching pattern: $pattern${NC}"
      sleep 10
      continue
    fi
    
    # Check if all pods are Running and Ready
    all_ready=true
    for pod in $pods; do
      status=$(kubectl get pod $pod -n $namespace -o jsonpath='{.status.phase}')
      ready_count=$(kubectl get pod $pod -n $namespace -o jsonpath='{.status.containerStatuses[0].ready}')
      
      if [ "$status" != "Running" ] || [ "$ready_count" != "true" ]; then
        all_ready=false
        echo -e "${YELLOW}Pod $pod is not ready yet. Status: $status, Ready: $ready_count${NC}"
        break
      fi
    done
    
    if [ "$all_ready" == "true" ]; then
      ready=true
      echo -e "${GREEN}All $pattern pods are ready!${NC}"
    else
      sleep 10
    fi
  done
}

# Check if Zookeeper is ready
check_pods_ready "zookeeper-[0-9]"

# Check if Kafka is ready
check_pods_ready "kafka-[0-9]"

# Check if PostgreSQL is ready
check_pods_ready "postgres-[0-9]"

# Deploy the remaining applications
echo -e "${YELLOW}Deploying application components...${NC}"
kubectl apply -f k8s/city-api-deployment.yaml
kubectl apply -f k8s/kafka-producer-deployment.yaml
kubectl apply -f k8s/flink-processor-deployment.yaml
kubectl apply -f k8s/db-manager-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for deployments to be ready
echo -e "${YELLOW}Waiting for application deployments to be ready...${NC}"
kubectl rollout status deployment/city-api -n global-city-streaming
kubectl rollout status deployment/kafka-producer -n global-city-streaming
kubectl rollout status deployment/flink-processor -n global-city-streaming
kubectl rollout status deployment/db-manager -n global-city-streaming
kubectl rollout status deployment/frontend -n global-city-streaming

echo -e "${GREEN}All components have been deployed!${NC}"
echo -e "${GREEN}You can access the frontend service at the external IP:${NC}"
kubectl get svc frontend -n global-city-streaming

# Check pod status
echo -e "${YELLOW}Current pod status:${NC}"
kubectl get pods -n global-city-streaming

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}If you encounter any issues, please check the logs with:${NC}"
echo -e "kubectl logs -n global-city-streaming <pod-name>" 