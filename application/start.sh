# This script manually builds the images of the 2 of the containers that can be found in 'docker-compose.yml'.
# Note that the 'postgres' image is automatically built from docker-compose by defining the path/context to
# its Dockerfile. The reason why I decided to manually build these 2 images in this script was to gain
# a deeper understanding and to also show that I know how to interact with containers in multiple
# different ways.


updateFlinkProcessor() {
    cd flink*

    ./mvn-cmd.sh # Always refresh the maven-dependencies prior to updating the docker image
    docker build -t flink-processor .

    cd ..
}

updateKafkaProducer() {
    cd kafka*
    docker build -t kafka-producer .
    
    cd ..
}

runApplication() {
    docker-compose -p streaming-city-project up -d
}



updateFlinkProcessor

updateKafkaProducer

runApplication