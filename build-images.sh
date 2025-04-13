# From the project root directory
docker buildx build \
  --build-context shared=./shared \
  -f kafka-producer/Dockerfile \
  -t joel030303/kafka-producer:latest \
  kafka-producer



# Push to Docker Hub
docker push joel030303/kafka-producer:latest