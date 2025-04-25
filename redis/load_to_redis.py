#!/usr/bin/env python3
import json
import redis
import os
import sys

# This script expects the static-cities.json file to be mounted at /data/static-cities.json

# Redis connection settings (we use localhost since we're in the same container)
REDIS_HOST = 'localhost'
REDIS_PORT = 6379

# Key prefixes for static city data with the new structure
STATIC_CITIES_ALL_KEY = "static:cities:all"
STATIC_CITY_PREFIX = "static:city:"

def load_static_cities():
    """Load static cities data from JSON file to Redis using the enhanced structure"""
    try:
        json_file_path = '/data/static-cities.json'
        print(f"Loading static cities from {json_file_path}")
        
        # Connect to Redis
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()  # Test connection
        
        # Load and parse the JSON file
        with open(json_file_path, 'r') as f:
            city_data = json.load(f)
        
        # Store data for each city using pipeline for efficiency
        pipe = r.pipeline()
        city_list = []
        country_codes = {}
        
        print(f"Processing {len(city_data)} static cities...")
        
        for city_name, city_info in city_data.items():
            # Create the key for this city
            key = f"{STATIC_CITY_PREFIX}{city_name}"
            
            # Store the city info as a hash
            pipe.delete(key)  # Clear existing data if any
            for field, value in city_info.items():
                pipe.hset(key, field, str(value))
            
            # Add to city list
            city_list.append(city_name)
            
            # Track country codes for all countries
            if 'country' in city_info:
                country = city_info['country']
                if country not in country_codes and 'country_code' in city_info:
                    country_codes[country] = city_info['country_code']
        
        # Store the list of all static cities
        pipe.delete(STATIC_CITIES_ALL_KEY)
        pipe.sadd(STATIC_CITIES_ALL_KEY, *city_list)
        
        # Store country codes for reference
        for country, code in country_codes.items():
            pipe.hset("static:country_codes", country, code)
        
        # Execute pipeline
        pipe.execute()
        print(f"Successfully loaded {len(city_data)} static cities to Redis")
        
        # Verify by getting a sample city
        if city_list:
            sample_city = city_list[0]
            sample_data = r.hgetall(f"{STATIC_CITY_PREFIX}{sample_city}")
            print(f"Sample static city data for {sample_city}: {sample_data}")
            
            # Show the structure
            print("\nCurrent Redis Structure:")
            print("========================")
            print(f"static:cities:all -> Set of all static city names")
            print(f"static:city:<cityname> -> Hash with city details")
            print(f"static:country_codes -> Hash of country to country_code mapping")
            print("========================")
        
        return True
    except Exception as e:
        print(f"Error loading static cities: {e}")
        return False

if __name__ == "__main__":
    load_static_cities() 