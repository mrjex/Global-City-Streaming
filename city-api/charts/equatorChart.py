###   LINE CHART SCRIPT  -->  EQUATOR CALCULATIONS   ###


# BUBBLE CHART + DOTTED LINE + LOG2(X) + LINE CHART


# Parses the content of a JSON file representative of a pool of cities' properties and visualizes it with these dimensions:
#   - X: A city's distance to the equator       (measured in latitudes)
#   - Y: A city's temperature                   (measured in celsius)


from pandas import *
import plotly.express as px
import plotly.graph_objects as go
import json
import sys
sys.path.append('/app')
from utils import parseYmlFile

# Add necessary paths for imports
sys.path.extend(['/app/city-api', '/app/city-api/apis'])

import apis.databaseJsonApi as databaseJsonApi
# import apis.databaseApi as databaseApi
import apis.mathCurveApi as mathCurveApi

configPath = "/app/configuration.yml" # The fixed absolute path to the central config file


# DEVELOPER CONFIGURATIONS

dataPointSize = 14 # The size of each city's displayed bubble on the chart
dataPointOutlizeWidth = 2
highestCityTemperature = 40


# Assign configuration variables from the central 'configuration.yml' file
cities = parseYmlFile(configPath, "cities")
displayLinearTrend = parseYmlFile(configPath, "visualizations.charts.equatorChart.displayLinearTrend")
displayLogarithmicTrend = parseYmlFile(configPath, "visualizations.charts.equatorChart.displayLogarithmicTrend")
displayActualTrend = parseYmlFile(configPath, "visualizations.charts.equatorChart.displayActualTrend")
pngOutput = parseYmlFile(configPath, "visualizations.charts.equatorChart.pngOutput")
queryAttribute = parseYmlFile(configPath, "visualizations.queryConfig.queryAttribute")
queryRequirement = parseYmlFile(configPath, "visualizations.queryConfig.queryRequirement")


# Reads the pre-defined city query configurations from 'configuraiton.yml' and returns a
# descriptive string of what type of query and parameters were defined by the developer
def formatQueryConfigs():
    if queryAttribute == "continent" or queryAttribute == "timeZoneOffset":
        return f", Query: '{queryAttribute}' = '{queryRequirement}'"

    return " [DISPLAY ALL CITIES]" # No filters were selected and the developer is interacting with the entire database



def defineTrendline():

    # Indicate that no trendline will be visually displayed
    if displayLinearTrend == False and displayActualTrend == False:
        return None
    
    # If the devloper by mistake enabled both trends, then default to only displaying the actual trend and print warning message
    if displayLinearTrend == True and displayActualTrend == True:
        print("Only one linear representation is possible at a time. Either display the general linear trend or the actual trend. Set 'displayLinearTrend' or 'displayActualTrend' to False")
        return "lowess"

    if displayActualTrend == True:
        return "lowess"
    
    return "ols"



def plotEquatorChart():
    f = open('/app/city-api/apis/database/response.json')
    jsonData = json.load(f)

    xArr = databaseJsonApi.getAllAttributeInstances("equatorDistance")
    yArr = databaseJsonApi.getAllAttributeInstances("temperatureCelsius")

    # Don't plot the chart if no cities matched the developer's specified query parameters
    if len(xArr) == 0:
        print(f"No cities matches the current query filters. Change the parameters 'queryAttribute' or/and 'queryRequirement' in 'configuration.yml'")
        f.close()
        return None

    temperatureColorScale = ['rgb(0, 255, 255)', 'rgb(255, 0, 0)']

    # Plot a bubble-chart with 'equatorDistance' as the X-value and 'temperatureCelsius' as the Y-value
    fig = px.scatter(
                        jsonData, x=xArr, y=yArr,
                        color="temperatureCelsius", color_continuous_scale=temperatureColorScale,
                        trendline=defineTrendline(),
                        hover_name="city",
                        labels={
                            "x": "Equator Distance (latitudes)",
                            "y": "Temperature (Celsius)",
                            "temperatureCelsius": "Temperature Scale"
                        },
                        title=f"Cities: Equator Distance vs Temperature{formatQueryConfigs()}"
                    )
    
    # Stylize the data-point-bubbles
    fig.update_traces(
                        marker=dict(size=dataPointSize,
                        line=dict(width=dataPointOutlizeWidth,
                        color='DarkSlateGrey')),
                        selector=dict(mode='markers')
                    )

    # If developer wants to plot the logarithmic trend, merge it with the main figure
    if displayLogarithmicTrend == True:
        logTrendFig = getexpectedLogarithmicTrend()
        finalFig = go.Figure(data=fig.data + logTrendFig.data)
        
        if pngOutput == True:
            exportPng(finalFig, getTypeOfQueryString(), getPngOutputString())
            
        f.close()
        return finalFig.to_json()
    else:
        if pngOutput == True:
            exportPng(fig, getTypeOfQueryString(), getPngOutputString())
            
        f.close()
        return go.Figure(data=fig.data).to_json()


# Fetches the data from the API and plots it on a graph
def getexpectedLogarithmicTrend():
    logarithmicCurveData = mathCurveApi.getDataArrays(highestCityTemperature)
    fig1 = px.line(logarithmicCurveData, x="equatorDistance", y="temperatureCelsius")
    return fig1



def exportPng(figure, typeOfQuery, fileOutputName):
    figure.write_image(f"/app/city-api/generated-artifacts/pngs/equator-chart/{typeOfQuery}/{fileOutputName}.png")



# Returns the name the output of the to-be produced .png file. The name
# represents the selected settings that the developer configured in
# configuration.yml
def getPngOutputString():

    str1 = "Linear Trend" if displayLinearTrend == True else ""
    str2 = "Logarithmic Trend" if displayLogarithmicTrend == True else ""
    str3 = "Actual Trend" if displayActualTrend == True else ""

    trendStringSum = len(str1) + len(str2) + len(str3)

    noTrendStr = "No trend" if trendStringSum == 0 else ""

    if len(noTrendStr) > 0:
        return f"Equator Chart [{noTrendStr}]"
    
    trendStrings = [str1, str2, str3]
    outputStr = "Equator Chart ["

    for currentStr in trendStrings:
        if len(currentStr) > 0:
            outputStr += currentStr + ", "

    outputStr += "]"

    return outputStr


# Checks the query attribute and returns it in a format coherent with the subfolders
# of the chart-png outputs that divides equator charts into query-categories
def getTypeOfQueryString():
    if queryAttribute == "continent":
        return "continent-queries"
    elif queryAttribute == "timeZoneOffset":
        return "timezone-queries"
    return "none-filter-queries"