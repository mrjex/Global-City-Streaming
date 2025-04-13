#!/bin/bash

# Docker Hub username
DOCKER_USERNAME="joel030303"

# Login to Docker Hub (you'll be prompted for password)
echo "Logging in to Docker Hub..."
docker login

# Array of services to build and push
declare -a services=(
    "frontend"
    "kafka-producer"
    "flink-processor"
    "city-api"
    "postgres"
    "db-manager"
)

# Function to check if required files exist
check_required_files() {
    local service=$1
    local missing_files=()
    
    case $service in
        "flink-processor")
            [[ ! -f "flink-processor/pom.xml" ]] && missing_files+=("flink-processor/pom.xml")
            [[ ! -f "flink-processor/wait-for-it.sh" ]] && missing_files+=("flink-processor/wait-for-it.sh")
            ;;
        "postgres")
            [[ ! -f "postgres/create_table.sql" ]] && missing_files+=("postgres/create_table.sql")
            ;;
        "kafka-producer")
            [[ ! -f "kafka-producer/requirements.txt" ]] && missing_files+=("kafka-producer/requirements.txt")
            ;;
    esac
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        echo "Error: Missing required files for $service:"
        printf '%s\n' "${missing_files[@]}"
        return 1
    fi
    return 0
}

# Build and push each service
for service in "${services[@]}"
do
    echo "Building $service..."
    
    # Check required files before building
    if ! check_required_files $service; then
        echo "Skipping $service due to missing files..."
        continue
    fi
    
    # Build the image with appropriate context
    case $service in
        "frontend")
            docker build -t $DOCKER_USERNAME/$service:latest -f frontend/Dockerfile .
            ;;
        "flink-processor")
            # Ensure wait-for-it.sh is executable
            chmod +x flink-processor/wait-for-it.sh
            docker build -t $DOCKER_USERNAME/$service:latest -f flink-processor/Dockerfile ./flink-processor
            ;;
        "postgres")
            docker build -t $DOCKER_USERNAME/$service:latest -f postgres/Dockerfile ./postgres
            ;;
        "city-api")
            docker build -t $DOCKER_USERNAME/$service:latest -f city-api/Dockerfile .
            ;;
        "db-manager")
            docker build -t $DOCKER_USERNAME/$service:latest -f db-manager/Dockerfile .
            ;;
        "kafka-producer")
            docker build -t $DOCKER_USERNAME/$service:latest -f kafka-producer/Dockerfile ./kafka-producer
            ;;
    esac
    
    # If build was successful, push the image
    if [ $? -eq 0 ]; then
        echo "Pushing $service to Docker Hub..."
        docker push $DOCKER_USERNAME/$service:latest
    else
        echo "Failed to build $service, skipping push..."
    fi
done

echo "All images have been built and pushed to Docker Hub!" 