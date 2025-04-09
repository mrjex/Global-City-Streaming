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
    
    # Check if city_data is empty
    city_data = {}
    
    # Try to fetch data for each city individually
    print("Fetching data for each city individually", file=sys.stderr)
    for city in cities:
        data = weather_api.fetch_city_data(city)
        if data:
            city_data[city] = data
            print(f"Added coordinates for {city}", file=sys.stderr)
    
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