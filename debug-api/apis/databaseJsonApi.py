# Json database manager

# Solely dedicated for the equator chart visualization

#   - queryApi.py + cityApi.py
#   - a composition of Weather API & Timezone API

import sys

sys.path.append('..')

import apis.geolocationApi as geolocationApi
import apis.weatherApi as weatherApi

import json

sys.path.append('..')
sys.path.append('../..')
import utils
sys.path.pop()


configPath = "../../configuration.yml"

# In shell scripts where this script is combined with other scripts to create a bigger sequence of automation,
# the path below is used from the invoking point to this file
pathFromShellScript = "../apis"
databasePath = f"{pathFromShellScript}/database/db.json"


# The query-file paths for "/logs" directory
#   - Key: The attribute to query
#   - Value: The path to the query's associated json-log file
databaseLogPaths = {
    "continent": f"{pathFromShellScript}/database/logs/query-continents.json",
    "timeZoneOffset": f"{pathFromShellScript}/database/logs/query-timezones.json"
}


# READ DEVELOPER DEBUG CONFIGURATIONS from 'configuration.yml'
citiesPool = utils.parseYmlFile(configPath, "debugApi.citiesPool")
queryAttribute = utils.parseYmlFile(configPath, "debugApi.queryConfig.queryAttribute")
queryRequirement = utils.parseYmlFile(configPath, "debugApi.queryConfig.queryRequirement")


# This function composes each JSON object for all the cities
def populateDB():
  citiesArr = [] # An array that gets assigned the dictionary-object for each city in the loop below

  for city in citiesPool:

    # Read the data from the APIs
    weatherCityObj = weatherApi.fetchCityData(city)
    timezoneDictionary = geolocationApi.fetchTimeZoneData(weatherCityObj['latitude'], weatherCityObj['longitude'])

    equatorDistanceAttribute = abs(weatherCityObj['latitude'])

    # Compose the data into new dictionary that holds the values
    # of the city's data in the current iteration
    currentCityObj = weatherCityObj

    # Assign the fetched and calculated attributes to the new object
    currentCityObj['timeZoneNotation'] = timezoneDictionary['timeZoneNotation']
    currentCityObj['timeZoneOffset'] = timezoneDictionary['timeZoneOffset']
    currentCityObj['equatorDistance'] = equatorDistanceAttribute

    citiesArr.append(currentCityObj)

  # Store the cities and their information as objects in a JSON file
  with open(databasePath, "w") as outfile: 
    json.dump(citiesArr, outfile, indent=4)

  return citiesArr



# FUNCTION:
#   - Iterates over all db-instances and only writes to (or updates) the instances stored in
#     the JSON files in which the target attribute satisfies the given requirement
#
# PARAMETERS:
#   - queryAttribute:     The name of the attribute in a city object
#   - queryRequirement:   The required value for a city's object to obtain
#
# EXAMPLE INPUTS:
#   - ("continent", "Europe")
#   - ("continent", "Asia")
#
#   - ("timeZoneOffset", "UTC+1")
#   - ("timeZoneOffset", "UTC-6")
#
def queryByAttribute(attributeToQuery, queryRequirement):

    # Define the 'log' output file that keeps track of the most recently performed query for a specific type
    outputJsonFile = databaseLogPaths[attributeToQuery]
    f = open(f"{pathFromShellScript}/database/db.json")

    jsonDB = json.load(f)

    matchedObjects = []

    for cityObj in jsonDB:
        if cityObj[attributeToQuery] == queryRequirement:
            matchedObjects.append(cityObj)
    

    # Update "/log" json file
    with open(outputJsonFile, "w") as outfile: 
        json.dump(matchedObjects, outfile, indent=4)
    
    # Always update 'response.json'
    with open(f"{pathFromShellScript}/database/response.json", "w") as outfile: 
        json.dump(matchedObjects, outfile, indent=4)



# Returns a one-dimensional array of all instances of a specific attribute.
# This is done by querying 'response.json' and for each city-object, append
# the specified attribute's value
def getAllAttributeInstances(attribute):
  return getCitiesAttribute(attribute)



# Returns an array of each cities' value tied to the key named 'attribute'.
# A few possible values for 'attribute' are "equatorDisance",
# "temperatureCelsius", "latitude", "continent" (referencing
# to the values in 'db.json')
def getCitiesAttribute(attribute):

    output = []

    f = open(f"{pathFromShellScript}/database/response.json") # Path is "debug-api\charts", since it's called from 'equator-chart.py'
    data = json.load(f)

    numInstances = len(data)

    # TODO: Reference lambda learning lessons to AlgoExpert directory --> README.md
    getCityAttribute = lambda data, i, attribute : data[i][f"{attribute}"]

    for i in range(numInstances):
        output.append(getCityAttribute(data, i, attribute))
    

    f.close()
    return output



# Returns the JSON object that obtains the inputted city name
def getCityObject(targetCity):
    f = open(f"{pathFromShellScript}/db.json")
    data = json.load(f)

    citiesPoolNum = len(data)

    for i in range(citiesPoolNum):
        cityObj = data[i]

        # Return the city's object if it was found in the .json database
        if cityObj['city'] == targetCity:
           return cityObj
    
    return f"The city '{targetCity}' isn't in the cities pool"




# Developer chooses to not apply any filter-conditions and retrieves all city objects
# Essentially, what this function does is to transfer the content from 'db.json' to
# 'respone.json'
def getAllCities():
    f = open(f"{pathFromShellScript}/database/db.json")
    jsonDB = json.load(f)

    with open(f"{pathFromShellScript}/database/response.json", "w") as outfile: 
        json.dump(jsonDB, outfile, indent=4)



# Generates the JSON database instances and queries them  -->  EquatorChart
def initiateDatabaseOperations(recreateDatabase):

  # Check if the developer wants to create an entirely new database (used for add/delete city operations)
  if recreateDatabase == 'True':
    createdDbInstances = populateDB()
    print(createdDbInstances)
  

  if queryAttribute == "timeZoneOffset" or queryAttribute == "continent":
    queryByAttribute(queryAttribute, queryRequirement)
  else:
    getAllCities()


initiateDatabaseOperations(sys.argv[1])