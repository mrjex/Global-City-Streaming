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
    print(f"API Key from environment: {os.environ.get('WEATHER_API_KEY', 'Not set')}", file=sys.stderr)
    weather_api = WeatherAPI()
    
    # Enable batch mode for efficiency
    weather_api.batch_enabled = True
    print(f"Batch mode enabled: {weather_api.batch_enabled}", file=sys.stderr)
    
    # Fetch city data
    print(f"Fetching data for cities: {cities}", file=sys.stderr)
    city_data = weather_api.fetch_cities_batch(cities)
    
    # Extract coordinates
    coordinates = {}
    
    # Handle both dictionary and generator return types
    if hasattr(city_data, 'items'):
        # If it's a dictionary (batch_enabled=True)
        print(f"City data is a dictionary with {len(city_data)} items", file=sys.stderr)
        for city, data in city_data.items():
            print(f"Processing city: {city}", file=sys.stderr)
            print(f"Data type: {type(data)}", file=sys.stderr)
            print(f"Data content: {data}", file=sys.stderr)
            
            if data:
                # Check if the data has the expected structure
                if isinstance(data, dict):
                    if 'latitude' in data and 'longitude' in data:
                        coordinates[city] = {
                            'latitude': data['latitude'],
                            'longitude': data['longitude']
                        }
                    else:
                        print(f"Data for {city} doesn't have latitude/longitude keys", file=sys.stderr)
                        print(f"Available keys: {list(data.keys())}", file=sys.stderr)
                else:
                    print(f"Data for {city} is not a dictionary", file=sys.stderr)
    else:
        # If it's a generator (batch_enabled=False)
        print("City data is a generator", file=sys.stderr)
        for city, data in city_data:
            print(f"Processing city: {city}", file=sys.stderr)
            print(f"Data type: {type(data)}", file=sys.stderr)
            print(f"Data content: {data}", file=sys.stderr)
            
            if data:
                # Check if the data has the expected structure
                if isinstance(data, dict):
                    if 'latitude' in data and 'longitude' in data:
                        coordinates[city] = {
                            'latitude': data['latitude'],
                            'longitude': data['longitude']
                        }
                    else:
                        print(f"Data for {city} doesn't have latitude/longitude keys", file=sys.stderr)
                        print(f"Available keys: {list(data.keys())}", file=sys.stderr)
                else:
                    print(f"Data for {city} is not a dictionary", file=sys.stderr)
    
    print(f"Returning coordinates for {len(coordinates)} cities", file=sys.stderr)
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