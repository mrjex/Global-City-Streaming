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
    pip3 install flask flask-cors && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the log server
COPY log-server.py /opt/flink/log-server.py

# Copy the wait script
COPY wait-for-it.sh /wait-for-it.sh
RUN dos2unix /wait-for-it.sh && chmod +x /wait-for-it.sh

# Create /mnt directory for logs (addresses the file write error)
RUN mkdir -p /mnt && chmod 777 /mnt

# Copy your Flink job from builder stage
COPY --from=builder /build/target/flink-kafka2postgres-1.0-SNAPSHOT.jar /opt/flink/usrlib/flink-processor.jar

# Create start script - run Flink in local execution mode
RUN echo '#!/bin/bash\n\
python3 /opt/flink/log-server.py & \n\
/wait-for-it.sh kafka:9092 -t 60 -- \n\
/wait-for-it.sh zookeeper:2181 -t 60 -- \n\
/wait-for-it.sh postgres:5432 -t 60 -- \n\
echo "Starting Flink job in local execution mode..." \n\
cd /opt/flink && \
mkdir -p /opt/flink/mnt && \
touch /opt/flink/mnt/exec-settings.txt && \
java -Dlog4j.configurationFile=file:///opt/flink/conf/log4j2.xml \
-Dkafka.bootstrap.servers=${KAFKA_SERVER} \
-Dzookeeper.connect=${ZOOKEEPER_SERVER} \
-cp "/opt/flink/lib/*:/opt/flink/usrlib/*" Main \n\
tail -f /dev/null' > /start.sh && \
dos2unix /start.sh && \
chmod +x /start.sh

CMD ["/start.sh"]