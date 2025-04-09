#!/usr/bin/env python3
import sys
import json
import os
from api import WeatherAPI

def get_city_coordinates(cities):
    """
    Get coordinates for a list of cities using the WeatherAPI.
    
    Args:
        cities (list): List of city names
        
    Returns:
        dict: Dictionary mapping city names to their coordinates
    """
    weather_api = WeatherAPI()
    weather_api.batch_enabled = True
    
    # Fetch city data
    print(f"Fetching data for {len(cities)} cities", file=sys.stderr)
    city_data = weather_api.fetch_cities_batch(cities)
    
    # DEBUG: Print the raw city_data to see what we're getting
    print(f"Raw city_data type: {type(city_data)}", file=sys.stderr)
    
    # Convert generator to dictionary if needed
    if hasattr(city_data, '__iter__') and not isinstance(city_data, dict):
        print("Converting generator to dictionary", file=sys.stderr)
        city_dict = {}
        for city, data in city_data:
            city_dict[city] = data
            print(f"Added to dictionary: {city} -> {data}", file=sys.stderr)
        city_data = city_dict
    
    print(f"Final city_data type: {type(city_data)}", file=sys.stderr)
    print(f"Final city_data: {city_data}", file=sys.stderr)
    
    # Check if city_data is empty
    if not city_data:
        print("city_data is empty!", file=sys.stderr)
        # Try to fetch data for each city individually
        print("Trying to fetch data for each city individually", file=sys.stderr)
        city_dict = {}
        for city in cities:
            data = weather_api.fetch_city_data(city)
            if data:
                city_dict[city] = data
                print(f"Added to dictionary: {city} -> {data}", file=sys.stderr)
        city_data = city_dict
    
    # Now we can safely serialize to JSON
    print(json.dumps(city_data))
    return city_data

if __name__ == "__main__":
    # Check if cities were provided as command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No cities provided"}))
        sys.exit(1)
    
    # Get cities from command line arguments
    cities = sys.argv[1:]
    
    # Get coordinates
    get_city_coordinates(cities) 