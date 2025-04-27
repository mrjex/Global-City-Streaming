# 📊 Data Visualization & Charts

## Overview
The project implements three main types of charts:
1. Bubble Charts
2. Pie Charts
3. Equator Charts

![charts-presentation](../docs/readme-pictures/visualization/charts-presentation.png)

## Bubble Chart

### Evolution
1. First successful plot with matplotlib:
![first-successful](../docs/readme-pictures/visualization/first-successful-plot.png)

2. First Plotly implementation:
![first-plotly-chart](../docs/readme-pictures/visualization/first-color-chart.PNG)

3. Color API integration with purple theme:
![color-api-integrated-purple-colors](../docs/readme-pictures/visualization/color-api-integrated-purple-colors.PNG)

4. Single city analysis:
![only-london-debug-api-artifact](../debug-api/generated-artifacts/pngs/bubble-chart/London,%20[YELLOW%20THEME].png)

### Large Scale Visualization
With 20,000+ instances:

1. With outlines:
![bubble-chart-no-outline](../docs/readme-pictures/visualization/bubble-chart-20000-instances-outline-setting.PNG)

2. Without outlines (improved visibility):
![bubble-chart-no-outline](../docs/readme-pictures/visualization/bubble-chart-20000-instances-no-outline-setting.PNG)

## Pie Chart

### Types

#### 1. Randomized Colors
![pieChart-randomized-colors](../docs/readme-pictures/visualization/pieChart-randomized-colors.PNG)
![pieChart-randomized-discarded-colors](../docs/readme-pictures/visualization/pieChart-randomized-disabled-colors.PNG)

#### 2. 4 Coldest Cities
Displays proportional temperature differences:
![pieChart-4-coldest](../docs/readme-pictures/visualization/pieChart-4-coldest-cities.PNG)

#### 3. Color Theme
Using Color API integration:

Red Theme:
![pieChart-red-color](../docs/readme-pictures/visualization/pieChart-red-colorThemed.PNG)

Brown Theme:
![pieChart-brown-color](../docs/readme-pictures/visualization/piechart-brown-theme.PNG)

## Equator Chart

### Interactive Features
![plot-logaritgmic-chart-1](../docs/readme-videos/plot-logarithmic-eq-chart.mp4)
![interact-equator-chart-logarithmic](../docs/readme-videos/interact-equator-chart-logarithmic.mp4)

### Analysis Examples

#### Asia Analysis
Linear trend:
![asia-linear-trend](../docs/readme-pictures/equator-solution/asia-linear-trend.PNG)

With logarithmic comparison:
![asia-linear-trend-and-logarithmic](../docs/readme-pictures/equator-solution/asia-linear-trend-and-logarithmic.PNG)

#### Europe Analysis
![europe-varying-results](../docs/readme-pictures/equator-solution/europe-varying-results.PNG)

#### UTC+1 Analysis
Basic trend:
![utc+1-results](../docs/readme-pictures/equator-solution/utc+1-result1.png)

With logarithmic comparison:
![utc+1-results-logarithmic](../docs/readme-pictures/equator-solution/utc+1-result1-logarithmic.png)

## Complexity Analysis

### Time Complexity
![chart-time-coplexity-plots](../docs/readme-pictures/fancy-edited/chart-time-complexity-plots.png)

### Chart-Specific Complexities
![chart-time-coplexity](../docs/readme-pictures/fancy-edited/charts-time-complexity.png)

### Instance Calculation
![num-cities-calculation](../docs/readme-pictures/fancy-edited/num-cities-calculation.png)

For more information about specific aspects:
- [Equator Analysis](./README-EQUATOR-ANALYSIS.md)
- [Development Process](./README-DEVELOPMENT-PROCESS.md) 