# Reset entire database: Remove all containers
stopAndClearDatabase() {
    docker-compose down
}


# Stop the containers and save the data instances in the SQL database until the next execution
stopAndSaveDatabase() {
    docker-compose stop
}


# Default Setting: Save the database data
stopAndSaveDatabase