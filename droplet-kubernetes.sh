# 2. Create the Kubernetes cluster
doctl kubernetes cluster create global-city-streaming-cluster \
    --region fra1 \
    --size s-2vcpu-4gb \
    --count 3

# 3. Configure kubectl to use the new cluster
doctl kubernetes cluster kubeconfig save global-city-streaming-cluster

# 4. Verify cluster connection
kubectl get nodes

# 5. Create the namespace first
kubectl apply -f k8s/namespace.yaml

# 6. Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml

# 7. Deploy stateful services first (wait for each to be ready)
kubectl apply -f k8s/kafka-zk-statefulset.yaml
kubectl apply -f k8s/postgres-statefulset.yaml

# Wait for stateful services to be ready (run these commands and wait for "Running" status)
kubectl get pods -n global-city-streaming

# 8. Deploy remaining services
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/city-api-deployment.yaml
kubectl apply -f k8s/kafka-producer-deployment.yaml
kubectl apply -f k8s/flink-processor-deployment.yaml
kubectl apply -f k8s/db-manager-deployment.yaml

# 9. Verify all deployments
kubectl get all -n global-city-streaming

# 10. Check logs if needed
kubectl logs -n global-city-streaming deployment/frontend
kubectl logs -n global-city-streaming deployment/city-api
# etc...