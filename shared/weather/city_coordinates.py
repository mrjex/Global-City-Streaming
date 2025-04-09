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
    # Initialize the WeatherAPI
    # The WeatherAPI class gets the API key from environment variables
    weather_api = WeatherAPI()
    
    # Enable batch mode for efficiency
    weather_api.batch_enabled = True
    
    # Fetch city data
    city_data = weather_api.fetch_cities_batch(cities)
    
    # Extract coordinates
    coordinates = {}
    
    # Handle both dictionary and generator return types
    if hasattr(city_data, 'items'):
        # If it's a dictionary (batch_enabled=True)
        for city, data in city_data.items():
            if data:
                coordinates[city] = {
                    'latitude': data.get('latitude', 0),
                    'longitude': data.get('longitude', 0)
                }
    else:
        # If it's a generator (batch_enabled=False)
        for city, data in city_data:
            if data:
                coordinates[city] = {
                    'latitude': data.get('latitude', 0),
                    'longitude': data.get('longitude', 0)
                }
    
    return coordinates

if __name__ == "__main__":
    # Check if cities were provided as command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No cities provided"}))
        sys.exit(1)
    
    # Get cities from command line arguments
    cities = sys.argv[1:]
    
    # Get coordinates
    coordinates = get_city_coordinates(cities)
    
    # Output as JSON
    print(json.dumps(coordinates)) 