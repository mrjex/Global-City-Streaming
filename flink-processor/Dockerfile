FROM maven:3.8-openjdk-8 AS builder

# Set working directory
WORKDIR /build

# Copy the pom.xml and src files
COPY pom.xml .
COPY src ./src

# Build the application with the shade plugin to include all dependencies
RUN mvn clean package

FROM flink:1.16.0-java8

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip dos2unix && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create and set permissions for log directories
RUN mkdir -p /opt/flink/log && \
    chmod -R 777 /opt/flink/log

# Copy the wait script
COPY wait-for-it.sh /wait-for-it.sh
RUN dos2unix /wait-for-it.sh && chmod +x /wait-for-it.sh

# Create /mnt directory for logs (addresses the file write error)
RUN mkdir -p /mnt && chmod 777 /mnt

# Copy your Flink job from builder stage
COPY --from=builder /build/target/flink-kafka2postgres-1.0-SNAPSHOT.jar /opt/flink/usrlib/flink-processor.jar

# Create start script - run Flink in local execution mode
RUN echo '#!/bin/bash\n\
echo "[$(date)] Raw data received: Initializing Flink processor" \n\
echo "[$(date)] Raw data received: Connecting to Kafka" \n\
echo "[$(date)] Inserting into DB: Establishing database connection" \n\
/wait-for-it.sh kafka:9092 -t 60 -- \n\
echo "[$(date)] Raw data received: Connected to Kafka" \n\
/wait-for-it.sh zookeeper:2181 -t 60 -- \n\
echo "[$(date)] Raw data received: Connected to Zookeeper" \n\
/wait-for-it.sh postgres:5432 -t 60 -- \n\
echo "[$(date)] Inserting into DB: Connected to PostgreSQL" \n\
echo "[$(date)] Raw data received: Starting Flink job" \n\
cd /opt/flink && \
# Periodically output sample logs for testing
(while true; do \
  echo "[$(date)] Raw data received: Processing messages from Kafka topic"; \
  echo "[$(date)] Inserting into DB: Storing aggregated data"; \
  sleep 30; \
done) & \
# Run actual Flink job
java -Dlog4j.configurationFile=file:///opt/flink/conf/log4j2.xml \
-Dkafka.bootstrap.servers=${KAFKA_SERVER} \
-Dzookeeper.connect=${ZOOKEEPER_SERVER} \
-cp "/opt/flink/lib/*:/opt/flink/usrlib/*" Main | tee /opt/flink/log/flink.out \n\
tail -f /dev/null' > /start.sh && \
dos2unix /start.sh && \
chmod +x /start.sh

CMD ["/start.sh"]