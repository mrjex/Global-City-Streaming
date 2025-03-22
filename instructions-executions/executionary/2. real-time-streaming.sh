#####     2. REAL-TIME STREAMING     #####

#   - Run the "/applicaton" sub-module and generate PostgresSQL instances in real-time


INFINITE_TIME="False"
SAVE_INSTANCES_ON_EXIT="True"

# Once all the docker images have been built locally on the developer's computer, it takes about
# 3 seconds for all the containers to get up and running with a successful connection
CONTAINERS_SETUP_DURATION=3

# If the developer sets $INFINITE_TIME to false, then this variable defines the amount of time
# that the containers will be up and running to produce and aggregate the data to the SQL database
ACTIVE_DURATION=30


TOTAL_DURATION=$(($ACTIVE_DURATION + $CONTAINERS_SETUP_DURATION))


# Text Colors
YELLOW='\033[1;33m'
NO_COLOR='\033[0m'


# Starts all containers by running the docker-compose file in "/applications"
# and depending on the configurations the developer provided, keeps the containers
# running for a finite fixed amount of time or until they are manually stopped
initiateStreaming() {
    UPTIME=${1}

    echo -e "${YELLOW} Starting containers... ${NO_COLOR}"
    docker-compose -f ../../application/docker-compose.yml -p streaming-city-project up -d

    if [ "${INFINITE_TIME}" == "False" ]; then
        sleep ${UPTIME} # Induce delay so that the running containers generates the PostgresSQL instances

        echo -e "${YELLOW} Stopping containers after ${TOTAL_DURATION} seconds... ${NO_COLOR}"

        if [ "${SAVE_INSTANCES_ON_EXIT}" == "True" ]; then
            stopAndSaveDatabase
        else
            stopAndClearDatabase
        fi
    fi
}


# Reset entire database: Remove all containers
stopAndClearDatabase() {
    docker-compose -f ../../application/docker-compose.yml -p streaming-city-project down
}


# Stop the containers and save the data instances in the SQL database until the next execution
stopAndSaveDatabase() {
    docker-compose -f ../../application/docker-compose.yml -p streaming-city-project stop
}


initiateStreaming ${TOTAL_DURATION}