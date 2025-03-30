#!/bin/bash

docker-compose -f application/docker-compose.yml -p global-city-streaming down -v

git pull origin main

docker-compose -f application/docker-compose.yml -p global-city-streaming up --build -d