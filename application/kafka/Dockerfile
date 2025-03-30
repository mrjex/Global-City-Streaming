FROM confluentinc/cp-kafka:7.3.2

USER root

# Install debugging tools
RUN microdnf update && \
    microdnf install -y nc procps-ng net-tools && \
    microdnf clean all

# Set environment variables for verbose logging
ENV KAFKA_LOG4J_ROOT_LOGLEVEL=INFO
ENV KAFKA_TOOLS_LOG4J_LOGLEVEL=INFO
ENV KAFKA_LOG4J_LOGGERS="kafka.controller=INFO,kafka.producer.async.DefaultEventHandler=INFO,state.change.logger=INFO,kafka.network.Processor=INFO"

USER appuser 