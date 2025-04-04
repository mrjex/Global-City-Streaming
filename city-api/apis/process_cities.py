# TODO - Idea:
#   - Add this as a 'middleware' layer of the "/city-api" container
#   - The purpose of this 'middleware' layer would be to serve as the
#     place where the APIs in "/apis" or the .sh scripts invokes
#     external functionalities. Then, @countryCodeApi.py could also
#     be rewritten/reframed as a middleware layer.


from weatherApi import fetchCityData
import sys
import json
import os

def process_city(city_name):
    try:
        # Debug environment variables
        weather_api_key = os.environ.get('WEATHER_API_KEY')
        if not weather_api_key:
            print(f"Warning: WEATHER_API_KEY not found in environment")
            return {
                "city": city_name,
                "temperature": None,
                "error": "Missing API key"
            }

        print(f"Fetching data for city: {city_name}")
        city_data = fetchCityData(city_name)
        
        if city_data is None:
            return {
                "city": city_name,
                "temperature": None,
                "error": "Failed to fetch weather data"
            }
            
        return {
            "city": city_name,
            "temperature": city_data.get('temperatureCelsius')
        }
    except Exception as e:
        print(f"Error processing {city_name}: {str(e)}")
        return {
            "city": city_name,
            "temperature": None,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        city_name = sys.argv[1]
        result = process_city(city_name)
        print(json.dumps(result), flush=True) 