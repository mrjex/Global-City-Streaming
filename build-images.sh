# From the project root directory
docker buildx build \
  --build-context shared=./shared \
  -f kafka-producer/Dockerfile \
  -t joel030303/kafka-producer:latest \
  kafka-producer



# Push to Docker Hub
docker push joel030303/kafka-producer:latest







# Build and push db-manager
docker build -t joel030303/db-manager:latest -f db-manager/Dockerfile .
docker push joel030303/db-manager:latest






cd flink-processor # Change to the flink-processor directory first
docker build -t joel030303/flink-processor:latest . # Then build the image
docker push joel030303/flink-processor:latest
