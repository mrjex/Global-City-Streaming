#####     1. INSTALL REQUIREMENTS     #####

#   - An automation for installaing all the necessary dependencies so that you can easily run the system
#   - Takes care of the installation of 3 modules: Kafka Producer, Flink Processor and SQL Debugging


SETUP_AND_RUN_CONTAINERS="True"


# The dependencies in requirements.txt are installed in the Dockerfile. In other words, you don't have to
# worry about manually installing it, since it is included in the automated docker image building process.
# You have two options to create this image. The first one is to create the image without running it, and
# the second choice is to create and run it simultaneously

setupKafkaProducer() {

    cd ../../kafka-producer

    # Create image without running it
    if [ "${SETUP_AND_RUN_CONTAINERS}" == "True" ]; then
        docker build -t kafka-producer .
    
    # Create image and run container
    else
        docker-compose -f ../../docker-compose.yml -p streaming-city-project up -d
    fi

    cd ../../instructions-executions/executionary
}


setupFlinkProcessor() {
    cd ../../flink-processor
    ./mvn-cmd.sh # Refresh the maven-dependencies

    # Create image without running it
    if [ "${SETUP_AND_RUN_CONTAINERS}" == "True" ]; then
        docker build -t flink-processor .
    
    # Create image and run container
    else
        docker-compose -f ../../docker-compose.yml -p streaming-city-project up -d
    fi

    cd ../../instructions-executions/executionary
}


setupSqlDebugging() {
    pip install -r ../../city-api/apis/requirements.txt
}



##  Kafka Producer Dependencies  ##

setupKafkaProducer


##  Flink Processor Dependencies  ##

setupFlinkProcessor



##  SQL Debugging Dependencies  ##

setupSqlDebugging