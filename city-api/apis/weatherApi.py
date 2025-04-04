###   WEATHER API   ###

# Note: North America and South America are combined into one continent 'America'

import requests
import os

## Weather API configurations  ##
apiKey = os.environ.get('WEATHER_API_KEY')  # Get API key from environment variable
apiUrl = "https://api.weatherapi.com/v1/current.json"


# curl -X GET "https://api.weatherapi.com/v1/current.json?key=165bb23217d246afb3e161429241806&q=London&aqi=yes"


def fetchCityData(city):
    try:
        if not apiKey:
            print(f"Error: WEATHER_API_KEY environment variable not set")
            return None
            
        query = {'key': apiKey, 'q': city, 'aqi':'yes'}
        response = requests.get(apiUrl, params=query)
        
        if not response.ok:
            print(f"Error: Weather API request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
        body_dict = response.json()
        cityObj = composeCityObject(body_dict, city)
        return cityObj
    except Exception as e:
        print(f"Error in fetchCityData: {str(e)}")
        return None



# Takes the JSON response from the REST HTTP Weather API and composes
# a unique dictionary only consisting of the values necessary in the
# context of this project
def composeCityObject(apiResponse, city):
  cityTemperature = apiResponse['current']['temp_c']
  country = apiResponse['location']['country']
  continent = apiResponse['location']['tz_id'].split("/")[0] # Split response by '/' and take the first element
  latitude = apiResponse['location']['lat']
  longitude = apiResponse['location']['lon']

  cityObj = {'city': city, 'country': country, 'continent': continent, 'temperatureCelsius': cityTemperature, 'latitude': latitude, 'longitude': longitude}
  return cityObj




# cityObj = fetchCityData("Bali")
# print(cityObj)