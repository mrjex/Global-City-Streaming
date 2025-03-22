###   TIME ZONE API   ###

# This script uses 2 different APIs, both of which are dependent on user-inputted
# geo-coordinates. This script serves as the composer of these two in Python-form
# that the fetched responses to the other components of this system upon request


import requests



apiNotationUrl = "https://timeapi.io/api/Time/current/coordinate"     # API Website: https://timeapi.io/swagger/index.html
apiOffsetUrl = "https://api.geotimezone.com/public/timezone"          # API Website: https://www.geotimezone.com/


# TODO: Document this function
# NOTES:

# Returns a notation-string about the timezone that's easy for humans to read.
# Examples: 'Europe/Amsterdam', 'Europe/Paris', 'Africa/Nairobi', 'Asia/Dubai'

# Returns a string that makes it easy to distinguish between
# the cities' timezone differentes.
# Examples: 'UTC+0', 'UTC+9', 'UTC+2', 'UTC-6'

def fetchApiData(apiUrl, latitude, longitude, attributeKey):
    query = {'latitude': latitude, 'longitude': longitude}
    response = requests.get(apiUrl, params=query)
    body_dict = response.json()
    return body_dict[attributeKey]



# Returns a key-value structure such that the values represent the city's timezone's
# human-readable notation as well as its hourly offset from the standard UTC time
def fetchTimeZoneData(latitude, longitude):

  return {
        'timeZoneNotation': fetchApiData(apiNotationUrl, latitude, longitude, "timeZone"),
        'timeZoneOffset': fetchApiData(apiOffsetUrl, latitude, longitude, "offset")
     }