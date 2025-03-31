# Generates bubble-charts that compares the different cities' differences
# in temperature for each API-Call. You as a developer can select the
# output format as follows:
#
#   - Boolean 'seperateGraphDisplay':
#       - True: Generates N different bubble-chart plots, where N is the
#         number of distinct cities
#       
#       - False: Generates one bubble-chart plot with N different categories.
#                Each category is distinguished by its unique RGB color.



from pandas import *
import plotly.express as px
import plotly.graph_objects as go
import sys
import os


sys.path.append('/app/debug-api')
import apis.colorApi as colorApi

sys.path.append('../..')
import utils


configPath = "/app/configuration.yml" # The fixed relative path to the central config file


pngOutput = utils.parseYmlFile(configPath, "debugApi.charts.bubbleChart.pngOutput")
colorTheme = utils.parseYmlFile(configPath, "debugApi.charts.bubbleChart.bubbleColorTheme")
separateGraphDisplay = utils.parseYmlFile(configPath, "debugApi.charts.bubbleChart.separateGraphDisplay")
 

##  OUTPUT FORMAT  ##
# pngOutput = True
# separateGraphDisplay = False
# colorTheme = "yellow"


dataPointSize = 11 # The size of each city's displayed bubble on the chart
dataPointOutlizeWidth = 0




cities = utils.parseYmlFile(configPath, "realTimeProduction.cities")



cityFigures = []



# Separately generates all graphs for each city and stores them as
# 'figure' variables inside 'cityFigures' array
def generateCityGraphs():

    cityColorMapping = colorApi.getCityChartColors(colorTheme)

    for city in cities:
        data = read_csv(f"/app/debug-api/generated-artifacts/csvs/{city}.csv")
        currentColor = cityColorMapping[city]

        currentCityFigure = px.scatter(data, x="API-Call", y="average_temperature",
                color="city",
                    hover_name="city", log_x=True, size_max=60,
                    color_discrete_sequence=[currentColor])

        currentCityFigure.update_traces(
                    marker=dict(size=dataPointSize,
                    line=dict(width=dataPointOutlizeWidth,
                    color='DarkSlateGrey')),
                    selector=dict(mode='markers')
                )
       
        cityFigures.append(currentCityFigure)



def mergeGraphs():
    data = cityFigures[0].data

    for i in range(1, len(cityFigures)):
        data  += cityFigures[i].data
    
    mergedGraph = go.Figure(data)


    mergedGraph.update_layout(
        title="City Temperatures",
        xaxis_title="N:th Weather API Response",
        yaxis_title="Average Temperature",
        legend_title="Cities",
        font=dict(
            family="Courier New, monospace",
            size=18,
            color="RebeccaPurple"
        )
    )
    
    if pngOutput == True:
        exportPng(mergedGraph, f"all-cities [{colorTheme.upper()} THEME]")

    mergedGraph.show()


def displaySeparateGraphs():
    for i in range(len(cityFigures)):

        if pngOutput == True:
            exportPng(cityFigures[i], f"{cities[i]}, [{colorTheme.upper()} THEME]")

        cityFigures[i].show()



def exportPng(figure, fileOutputName):
    figure.write_image(f"/app/public/bubble-chart/{fileOutputName}.png")


def plotBubbleChart():
    generateCityGraphs()

    if separateGraphDisplay:
        displaySeparateGraphs()
    else:
        mergeGraphs()

import sys
import os
sys.path.append('/app/debug-api')

import utils
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Configuration file path
configPath = "/app/configuration.yml"

# Get cities from configuration
cities = utils.parseYmlFile(configPath, "realTimeProduction.cities")

# Read data from CSV files
data = []
for city in cities:
    try:
        df = pd.read_csv(f"/app/debug-api/generated-artifacts/csvs/{city}.csv")
        for _, row in df.iterrows():
            data.append({
                'city': row['city'],
                'temperature': row['average_temperature'],
                'api_call': row['API-Call']
            })
    except Exception as e:
        print(f"Error reading data for {city}: {e}")

# Create bubble chart
df = pd.DataFrame(data)
fig = px.scatter(df, x='api_call', y='temperature', color='city',
                 title='Temperature vs API Call by City',
                 labels={'api_call': 'API Call Number', 'temperature': 'Temperature (°C)'})

# Update layout
fig.update_layout(
    title_x=0.5,
    plot_bgcolor='white',
    paper_bgcolor='white',
    font=dict(size=12)
)

# Save chart as HTML
fig.write_html("/app/public/bubble_chart.html")