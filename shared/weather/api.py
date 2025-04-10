import os
import requests
import sys
from typing import Optional, Dict, Any, List

class WeatherAPI:
    def __init__(self):
        self.api_key = os.environ.get('WEATHER_API_KEY')
        self.api_url = "https://api.weatherapi.com/v1/current.json"
        self.batch_enabled = False  # Default to sequential processing
        
        if not self.api_key:
            raise ValueError("WEATHER_API_KEY environment variable not set")

    def fetch_city_data(self, city: str) -> Optional[Dict[str, Any]]:
        """
        Fetch weather data for a city.
        Returns a standardized city object or None if the request fails.
        """
        try:
            query = {'key': self.api_key, 'q': city, 'aqi': 'yes'}
            response = requests.get(self.api_url, params=query)
            
            if not response.ok:
                print(f"Error: Weather API request failed with status {response.status_code}", file=sys.stderr)
                return None
                
            data = response.json()
            result = self._compose_city_object(data, city)
            return result
            
        except Exception as e:
            print(f"Error fetching data for {city}: {str(e)}", file=sys.stderr)
            return None
    
    def fetch_cities_batch(self, cities: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch weather data for multiple cities.
        If batch_enabled is True, returns a dictionary of all cities at once.
        If batch_enabled is False (default), yields each city's data as it's processed.
        """
        print(f"fetch_cities_batch called with batch_enabled={self.batch_enabled}", file=sys.stderr)
        if self.batch_enabled:
            # Batch mode: process all cities at once and return dict
            results = {}
            for city in cities:
                print(f"Fetching data for {city} in batch mode", file=sys.stderr)
                data = self.fetch_city_data(city)
                print(f"Data for {city}: {data}", file=sys.stderr)
                if data:  # Only add if data is not None
                    results[city] = data
            print(f"Batch results: {results}", file=sys.stderr)
            return results
        else:
            # Sequential mode: yield each city's data as it's processed
            for city in cities:
                data = self.fetch_city_data(city)
                yield city, data
            
    def _compose_city_object(self, api_response: Dict[str, Any], city: str) -> Dict[str, Any]:
        """
        Compose a standardized city object from the API response.
        """
        try:
            # Extract latitude and longitude from the API response
            lat = api_response['location']['lat']
            lon = api_response['location']['lon']
            
            result = {
                'city': city,
                'country': api_response['location']['country'],
                'continent': api_response['location']['tz_id'].split("/")[0],
                'temperatureCelsius': api_response['current']['temp_c'],
                'latitude': lat,
                'longitude': lon
            }
            return result
        except Exception as e:
            print(f"Error composing city object for {city}: {str(e)}", file=sys.stderr)
            return None 