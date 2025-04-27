

# Pull all new images from the dockr hub registry and run the system
forceNewPull() {
    docker compose -p global-city-streaming up -d --pull always
}


# Run the system with the cached images
runCached() {
    docker compose -p global-city-streaming up -d
}




##  MAIN  ##


forceNewPull
# runCached