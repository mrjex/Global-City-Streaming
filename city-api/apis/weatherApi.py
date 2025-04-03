###   WEATHER API   ###

# Note: North America and South America are combined into one continent 'America'


import requests

## Weather API configurations  ##
# city = "Stockholm" # Send API-requests for weather temperature in London city
apiKey = "165bb23217d246afb3e161429241806" # Your generated API key from your private account (https://www.weatherapi.com/my/)
apiUrl = "https://api.weatherapi.com/v1/current.json"


# curl -X GET "https://api.weatherapi.com/v1/current.json?key=165bb23217d246afb3e161429241806&q=London&aqi=yes"


def fetchCityData(city):
  query = {'key': apiKey, 'q': city, 'aqi':'yes'}
  response = requests.get(apiUrl, params=query)
  body_dict = response.json()

  cityObj = composeCityObject(body_dict, city)
  return cityObj



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