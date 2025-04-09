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
    
    # Extract coordinates
    coordinates = {}
    
    # Handle both dictionary and generator return types
    if isinstance(city_data, dict):
        # If it's a dictionary (batch_enabled=True)
        print(f"Processing {len(city_data)} cities from dictionary", file=sys.stderr)
        for city, data in city_data.items():
            if data:
                # Check if the data has the expected structure
                if isinstance(data, dict):
                    if 'latitude' in data and 'longitude' in data:
                        coordinates[city] = {
                            'latitude': data['latitude'],
                            'longitude': data['longitude']
                        }
                        print(f"Added coordinates for {city}: {data['latitude']}, {data['longitude']}", file=sys.stderr)
                    else:
                        print(f"Missing latitude/longitude for {city}. Data: {data}", file=sys.stderr)
                else:
                    print(f"Data for {city} is not a dictionary: {type(data)}", file=sys.stderr)
            else:
                print(f"No data returned for {city}", file=sys.stderr)
    else:
        # If it's a generator (batch_enabled=False)
        print("Processing cities from generator", file=sys.stderr)
        for city, data in city_data:
            if data:
                # Check if the data has the expected structure
                if isinstance(data, dict):
                    if 'latitude' in data and 'longitude' in data:
                        coordinates[city] = {
                            'latitude': data['latitude'],
                            'longitude': data['longitude']
                        }
                        print(f"Added coordinates for {city}: {data['latitude']}, {data['longitude']}", file=sys.stderr)
                    else:
                        print(f"Missing latitude/longitude for {city}. Data: {data}", file=sys.stderr)
                else:
                    print(f"Data for {city} is not a dictionary: {type(data)}", file=sys.stderr)
            else:
                print(f"No data returned for {city}", file=sys.stderr)
    
    print(f"Returning coordinates for {len(coordinates)} cities", file=sys.stderr)
    
    # Output the coordinates as JSON to stdout
    print(json.dumps(coordinates))
    
    return coordinates

if __name__ == "__main__":
    # Check if cities were provided as command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No cities provided"}))
        sys.exit(1)
    
    # Get cities from command line arguments
    cities = sys.argv[1:]
    
    # Get coordinates
    get_city_coordinates(cities) 