##  A bundle of frequently used commands for development  ##


docker compose -p global-city-streaming down

docker compose -p global-city-streaming up -d

docker compose -p global-city-streaming up -d --build frontend

docker compose -p global-city-streaming build --no-cache


docker compose -p global-city-streaming build frontend city-api


docker compose -p global-city-streaming build kafka-producer --no-cache


docker compose build --no-cache frontend city-api