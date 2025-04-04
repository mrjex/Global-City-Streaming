from weatherApi import fetchCityData
import sys
import json

def process_city(city_name):
    try:
        print(f"Fetching data for city: {city_name}", flush=True)
        city_data = fetchCityData(city_name)
        return {
            "city": city_name,
            "temperature": city_data.get('temperatureCelsius')
        }
    except Exception as e:
        print(f"Error processing {city_name}: {str(e)}", flush=True)
        return {
            "city": city_name,
            "temperature": None
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        city_name = sys.argv[1]
        result = process_city(city_name)
        print(json.dumps(result), flush=True) 