#!/bin/bash

# docker login

docker build -t joel030303/city-api:latest -f city-api/Dockerfile .
docker build -t joel030303/db-manager:latest -f db-manager/Dockerfile .
docker build -t joel030303/flink-processor:latest ./flink-processor
docker build -t joel030303/frontend:latest -f frontend/Dockerfile .
docker build -t joel030303/kafka-producer:latest ./kafka-producer
docker build -t joel030303/postgres:latest ./postgres
docker build -t joel030303/redis:latest ./redis

docker push joel030303/city-api:latest
docker push joel030303/db-manager:latest
docker push joel030303/flink-processor:latest
docker push joel030303/frontend:latest
docker push joel030303/kafka-producer:latest
docker push joel030303/postgres:latest
docker push joel030303/redis:latest 