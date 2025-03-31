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

# Custom color palette for better visuals
color_palette = {
    'Bangkok': '#FF6B6B',    # Coral Red
    'Lisbon': '#4ECDC4',     # Turquoise
    'Paris': '#45B7D1',      # Ocean Blue
    'Dubai': '#96CEB4',      # Sage Green
    'Tokyo': '#FFBE0B',      # Amber
    'London': '#3D405B',     # Navy Blue
    'Moscow': '#E63946',     # Imperial Red
    'Madrid': '#588B8B'      # Teal
}

# Read data from CSV files and create individual charts
charts_data = []
for city in cities:
    try:
        df = pd.read_csv(f"/app/debug-api/generated-artifacts/csvs/{city}.csv")
        
        # Create individual bubble chart for each city
        fig = go.Figure()
        
        # Add scatter plot with enhanced bubble styling
        fig.add_trace(go.Scatter(
            x=df['API-Call'],
            y=df['average_temperature'],
            mode='markers',
            name=city,
            marker=dict(
                size=15,
                color=color_palette.get(city, '#FF9F1C'),
                line=dict(
                    color='white',
                    width=1
                ),
                opacity=0.7,
                symbol='circle'
            ),
            hovertemplate=
            '<b>%{text}</b><br>' +
            'API Call: %{x}<br>' +
            'Temperature: %{y:.1f}°C<br>' +
            '<extra></extra>',
            text=[city] * len(df)
        ))

        # Update layout for better visualization
        fig.update_layout(
            title=dict(
                text=f'Temperature Trends for {city}',
                x=0.5,
                y=0.95,
                xanchor='center',
                yanchor='top',
                font=dict(
                    size=24,
                    color='#2B2D42'
                )
            ),
            xaxis=dict(
                title='API Call Sequence',
                gridcolor='#EAEAEA',
                showline=True,
                linecolor='#2B2D42',
                linewidth=2,
                tickfont=dict(size=12)
            ),
            yaxis=dict(
                title='Temperature (°C)',
                gridcolor='#EAEAEA',
                showline=True,
                linecolor='#2B2D42',
                linewidth=2,
                tickfont=dict(size=12)
            ),
            plot_bgcolor='white',
            paper_bgcolor='white',
            showlegend=False,
            hovermode='closest',
            margin=dict(t=100, b=50, l=50, r=50),
            shapes=[
                # Add subtle gradient background
                dict(
                    type='rect',
                    xref='paper',
                    yref='paper',
                    x0=0,
                    y0=0,
                    x1=1,
                    y1=1,
                    fillcolor='#F8F9FA',
                    opacity=0.3,
                    layer='below',
                    line_width=0,
                )
            ]
        )

        # Add hover effects and interactivity
        fig.update_traces(
            hoverlabel=dict(
                bgcolor='white',
                font_size=14,
                font_family='Arial'
            )
        )

        # Save each chart
        fig.write_html(f"/app/public/bubble_chart_{city.lower().replace(' ', '_')}.html")
        charts_data.append({
            'city': city,
            'chart_path': f"bubble_chart_{city.lower().replace(' ', '_')}.html"
        })
        
    except Exception as e:
        print(f"Error processing data for {city}: {e}")

# Create an index file that lists all charts
index_html = """
<!DOCTYPE html>
<html>
<head>
    <style>
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
            gap: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .chart-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.3s ease;
        }
        .chart-container:hover {
            transform: translateY(-5px);
        }
        iframe {
            width: 100%;
            height: 500px;
            border: none;
        }
    </style>
</head>
<body>
    <div class="chart-grid">
"""

for chart in charts_data:
    index_html += f"""
        <div class="chart-container">
            <iframe src="{chart['chart_path']}"></iframe>
        </div>
    """

index_html += """
    </div>
</body>
</html>
"""

with open("/app/public/bubble_charts.html", "w") as f:
    f.write(index_html)