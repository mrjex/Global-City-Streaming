#!/bin/bash

# Docker Hub username
DOCKER_USERNAME="joel030303"

# Update frontend-deployment.yaml
sed -i "s|image: your-registry/frontend:latest|image: $DOCKER_USERNAME/frontend:latest|g" k8s/frontend-deployment.yaml

# Update postgres-statefulset.yaml
sed -i "s|image: postgres:latest|image: $DOCKER_USERNAME/postgres:latest|g" k8s/postgres-statefulset.yaml

# Create city-api deployment if it doesn't exist
cat > k8s/city-api-deployment.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: city-api
  namespace: city-streaming
spec:
  ports:
  - port: 8003
    targetPort: 8003
    name: http
  selector:
    app: city-api
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: city-api
  namespace: city-streaming
spec:
  replicas: 2
  selector:
    matchLabels:
      app: city-api
  template:
    metadata:
      labels:
        app: city-api
    spec:
      containers:
      - name: city-api
        image: $DOCKER_USERNAME/city-api:latest
        ports:
        - containerPort: 8003
        env:
        - name: PYTHONPATH
          value: "/app/city-api"
        - name: GEODB_CITIES_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: geodb-cities-api-key
        - name: WEATHER_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: weather-api-key
        - name: GIPHY_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: giphy-api-key
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
EOF

# Create kafka-producer deployment
cat > k8s/kafka-producer-deployment.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: kafka-producer
  namespace: city-streaming
spec:
  ports:
  - port: 8000
    targetPort: 8000
    name: http
  selector:
    app: kafka-producer
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-producer
  namespace: city-streaming
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kafka-producer
  template:
    metadata:
      labels:
        app: kafka-producer
    spec:
      containers:
      - name: kafka-producer
        image: $DOCKER_USERNAME/kafka-producer:latest
        ports:
        - containerPort: 8000
        env:
        - name: KAFKA_SERVER
          value: "kafka:9092"
        - name: ZOOKEEPER_SERVER
          value: "zookeeper:2181"
        - name: PRODUCER_INTERVAL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: PRODUCER_INTERVAL
        - name: WEATHER_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: weather-api-key
        resources:
          limits:
            memory: "5Gi"
            cpu: "2000m"
          requests:
            memory: "2Gi"
            cpu: "1000m"
EOF

# Create flink-processor deployment
cat > k8s/flink-processor-deployment.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: flink-processor
  namespace: city-streaming
spec:
  ports:
  - port: 8001
    targetPort: 8001
    name: http
  selector:
    app: flink-processor
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flink-processor
  namespace: city-streaming
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flink-processor
  template:
    metadata:
      labels:
        app: flink-processor
    spec:
      containers:
      - name: flink-processor
        image: $DOCKER_USERNAME/flink-processor:latest
        ports:
        - containerPort: 8001
        env:
        - name: KAFKA_SERVER
          value: "kafka:9092"
        - name: ZOOKEEPER_SERVER
          value: "zookeeper:2181"
        - name: FLINK_ENV_JAVA_OPTS
          value: "-XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+ParallelRefProcEnabled -XX:+UseStringDeduplication -XX:+AggressiveOpts"
        - name: FLINK_MAX_PARALLELISM
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: FLINK_MAX_PARALLELISM
        - name: FLINK_PARALLELISM
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: FLINK_PARALLELISM
        resources:
          limits:
            memory: "5Gi"
            cpu: "2000m"
          requests:
            memory: "2Gi"
            cpu: "1000m"
EOF

# Create db-manager deployment
cat > k8s/db-manager-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-manager
  namespace: city-streaming
spec:
  replicas: 1
  selector:
    matchLabels:
      app: db-manager
  template:
    metadata:
      labels:
        app: db-manager
    spec:
      containers:
      - name: db-manager
        image: $DOCKER_USERNAME/db-manager:latest
        env:
        - name: POSTGRES_HOST
          value: "postgres"
        - name: POSTGRES_PORT
          value: "5432"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: POSTGRES_DB
          value: "postgres"
        - name: MAX_RECORDS
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: MAX_RECORDS
        - name: CHECK_INTERVAL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: CHECK_INTERVAL
        - name: BATCH_DELETE_SIZE
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: BATCH_DELETE_SIZE
        resources:
          limits:
            memory: "2560Mi"
            cpu: "1000m"
          requests:
            memory: "1Gi"
            cpu: "500m"
EOF

echo "Kubernetes manifests have been updated with Docker Hub image references!" 