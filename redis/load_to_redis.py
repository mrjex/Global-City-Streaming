#!/usr/bin/env python3
import json
import redis
import os
import sys

# This script expects the static-cities.json file to be mounted at /data/static-cities.json

# Redis connection settings (we use localhost since we're in the same container)
REDIS_HOST = 'localhost'
REDIS_PORT = 6379

# Key prefix for static city data
STATIC_CITY_PREFIX = "static_city:"
ALL_STATIC_CITIES_KEY = "static_cities:all"

def load_static_cities():
    """Load static cities data from JSON file to Redis"""
    try:
        json_file_path = '/data/static-cities.json'
        print(f"Loading static cities from {json_file_path}")
        
        # Connect to Redis
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()  # Test connection
        
        # Load and parse the JSON file
        with open(json_file_path, 'r') as f:
            city_data = json.load(f)
        
        # Store data for each city
        pipe = r.pipeline()
        city_list = []
        
        print(f"Processing {len(city_data)} cities...")
        
        for city_name, city_info in city_data.items():
            key = f"{STATIC_CITY_PREFIX}{city_name}"
            # Store as a hash for simplicity and compatibility
            pipe.delete(key)  # Clear existing data if any
            for field, value in city_info.items():
                pipe.hset(key, field, str(value))
            city_list.append(city_name)
        
        # Store the list of all static cities
        pipe.delete(ALL_STATIC_CITIES_KEY)
        pipe.rpush(ALL_STATIC_CITIES_KEY, *city_list)
        
        # Execute pipeline
        pipe.execute()
        print(f"Successfully loaded {len(city_data)} cities to Redis")
        
        # Verify by getting a sample city
        if city_list:
            sample_city = city_list[0]
            sample_data = r.hgetall(f"{STATIC_CITY_PREFIX}{sample_city}")
            print(f"Sample city data for {sample_city}: {sample_data}")
        
        return True
    except Exception as e:
        print(f"Error loading static cities: {e}")
        return False

if __name__ == "__main__":
    load_static_cities() 