#####     3. CONTAINER DEBUGGING     #####

#   - Enters the shell environment of the selected container and
#     allows the developer to run SQL queries and check the logs
#     and status of the containers


# Prerequisite to running this script:
#   - Make sure that the containers you wish to debug are up and running.
#     If you are struggling with setting up the containers, go back to
#     the first and second shell scripts.


# The conainters' names generated from "/application/docker-compose.yml". These can also be accessed through Docker Desktop
declare -a CONTAINERS=("postgres" "kafka-producer-1" "kafka-1" "zookeeper-1" "flink-processor-1")


##  DEVELOPER CONFIGURATIONS  ##

CONTAINER_TO_DEBUG=${CONTAINERS[4]} # Change the index to the corresponding container to debug here
CHECK_LOGS="False"
PERFORM_SQL_QUERIES="True"



# Takes the name of the running container as 
getContainerIdByName() {
    CONTAINER_ID=$(docker ps -aqf "name=${1}")
    echo "${CONTAINER_ID}"
}


# Enters the PostgresSQL's container and authorizes username and password
# to connect to the database
connectToPostgresDatabase() {
    enterContainerShell "postgres"
    psql -U postgres -d postgres

    \dt # List all existing relations/tables in tabular form
}


# Play around with the real-time logs of the containers
checkContainerLogs() {
    CONTAINER_NAME=${1}
    CONTAINER_ID=$( getContainerIdByName "${CONTAINER_NAME}" )

    docker logs --tail 2000 ${CONTAINER_ID}
}


enterContainerShell() {
    CONTAINER_NAME=${1}
    CONTAINER_ID=$( getContainerIdByName "${CONTAINER_NAME}" )

    docker exec -it "${CONTAINER_ID}" bash
}

# Runs the specified .sql file based on the query type
runPostgresQueries() {

    # connectToPostgresDatabase

    # Note: Change the command below to your desired query. A few example
    # queries can be found in the directory of this shell script. They are
    # contained in the .sql files that are tied to the 3rd tutorial.
    # MY_QUERY="SELECT * FROM weather;"
    MY_QUERY=${1}

    docker exec -it postgres psql -U postgres -d postgres -c "${MY_QUERY}"
}



# Display the current real-time logs of the specified container
if [ "${CHECK_LOGS}" == "True" ]; then
    checkContainerLogs "${CONTAINER_TO_DEBUG}"
fi


if [ "${PERFORM_SQL_QUERIES}" == "True" ]; then
    runPostgresQueries "SELECT city FROM weather
WHERE id = 10;"
fi


if [ "${CHECK_LOGS}" == "False" ] && [ "${PERFORM_SQL_QUERIES}" == "False" ]; then
    echo "You deactivated all configuration options. Set 'CHECK_LOGS' or/and 'PERFORM_SQL_QUERIES' to 'True'."
fi