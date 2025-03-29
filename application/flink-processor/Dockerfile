FROM openjdk:8u151-jdk-alpine3.7

# Install Bash
RUN apk add --no-cache bash libc6-compat dos2unix

# Copy resources
WORKDIR /
COPY wait-for-it.sh wait-for-it.sh
COPY target/flink-kafka2postgres-1.0-SNAPSHOT-jar-with-dependencies.jar flink-processor.jar

# Fix line endings and set permissions
RUN dos2unix wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Wait for Zookeeper and Kafka to be available and run application
CMD ./wait-for-it.sh -s -t 30 $ZOOKEEPER_SERVER -- ./wait-for-it.sh -s -t 30 $KAFKA_SERVER -- java -Xmx512m -jar flink-processor.jar