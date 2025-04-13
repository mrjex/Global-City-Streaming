#!/bin/bash

# Update namespace in all yaml files
for file in k8s/*.yaml; do
    if [ "$file" != "k8s/namespace.yaml" ]; then
        sed -i 's/namespace: city-streaming/namespace: global-city-streaming/g' "$file"
    fi
done

echo "Updated namespace in all Kubernetes manifests!" 