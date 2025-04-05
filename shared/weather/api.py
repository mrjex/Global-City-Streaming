import os
import requests
from typing import Optional, Dict, Any, List

class WeatherAPI:
    def __init__(self):
        self.api_key = os.environ.get('WEATHER_API_KEY')
        self.api_url = "https://api.weatherapi.com/v1/current.json"
        
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
                print(f"Error: Weather API request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
            data = response.json()
            return self._compose_city_object(data, city)
            
        except Exception as e:
            print(f"Error fetching data for {city}: {str(e)}")
            return None
    
    def fetch_cities_batch(self, cities: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch weather data for multiple cities in a batch.
        Returns a dictionary mapping city names to their data.
        """
        results = {}
        for city in cities:
            results[city] = self.fetch_city_data(city)
        return results
            
    def _compose_city_object(self, api_response: Dict[str, Any], city: str) -> Dict[str, Any]:
        """
        Compose a standardized city object from the API response.
        """
        return {
            'city': city,
            'country': api_response['location']['country'],
            'continent': api_response['location']['tz_id'].split("/")[0],
            'temperatureCelsius': api_response['current']['temp_c'],
            'latitude': api_response['location']['lat'],
            'longitude': api_response['location']['lon']
        } 