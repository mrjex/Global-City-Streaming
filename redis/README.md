# Extended Redis with Static Cities Loader

This directory contains files that extend the Redis image with functionality to load static city data from a JSON file.

## Components

- `Dockerfile` - Extends the Redis Alpine image with Python and our loader script
- `entrypoint.sh` - Custom entry point that starts Redis and conditionally loads data
- `load_to_redis.py` - Python script that loads city data into Redis
- `requirements.txt` - Python dependencies for the loader script

## How It Works

When the container starts:

1. Redis server starts as normal
2. The entry point script checks if the `LOAD_STATIC_CITIES` environment variable is set to "true"
3. If true, it looks for the static-cities.json file at the path `/data/static-cities.json`
4. If the file is found, it loads the data into Redis using the Python script

## Data Structure in Redis

- Each city is stored as a Redis hash under the key `static_city:{city_name}`
- The list of all city names is stored as a Redis list under the key `static_cities:all`

## How to Enable

To enable the loading of static cities data, make these changes in your docker-compose.yml:

1. Update the `redis` service to use the build context instead of the image:
   ```yaml
   redis:
     build:
       context: ./redis
     # ... rest of configuration
   ```

2. Add the environment variable:
   ```yaml
   environment:
     - LOAD_STATIC_CITIES=true
   ```

3. Mount the static-cities.json file:
   ```yaml
   volumes:
     - redis_data:/data
     - ./dev-endpoints/static-cities-data/static-cities.json:/data/static-cities.json:ro
   ```

## Accessing City Data

To get data for a specific city from Redis:

```
HGETALL static_city:London
```

To get the list of all cities:

```
LRANGE static_cities:all 0 -1
``` 