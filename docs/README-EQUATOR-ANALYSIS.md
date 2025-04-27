# 🌡 Equator Distance Temperature Analysis

## Hypothesis
> The closer to the equator a city is, the higher the average temperature is

This project explores and validates this hypothesis through data analysis and mathematical modeling.

## Geographic Basis
![lat-long-earth](../docs/readme-pictures/equator/1.%20latitude-longitude-earth.gif)

Key concepts:
- Equator is at latitude 0°
- Total latitude range: -90° to 90°
- Distance to equator = absolute value of latitude

## Mathematical Analysis

### Theoretical Foundation
The relationship between temperature and equator distance follows a logarithmic pattern based on:

1. **Theoretical Reasoning:** Improvements are relative to prior state
2. **Mathematical Reasoning:** Return on investment decreases with progress
3. **General Real-World Application:** Follows standard deviation patterns

![standard-deviation](../docs/readme-pictures/architecture/bell-curve-standard-deviation.jpg)

### Formula Development

#### Initial Analysis
![equator-distance-analysis](../docs/readme-pictures/equator/equator-distance-solution-analysis.JPG)

#### Experimentation Phase
Series of tests in Geogebra to determine optimal formula:

1. X0 Value Calculation:
![calculate-x0-value](../docs/readme-pictures/equator-maths/calculate-x-0-value.PNG)

2. Formula Variants:
![final-formula-3-variants](../docs/readme-pictures/equator-maths/final-formula-3-variants.PNG)

3. Logarithmic Base Testing:
![geogebra-experiment-log-bases](../docs/readme-pictures/equator-maths/geogebra-experiment-with-log-bases.PNG)

4. Formula Elicitation:
![geogebra-experiment-eliciation-of-formula](../docs/readme-pictures/equator-maths/geogebra-experimentation-elicitation-of-formula.PNG)

#### M-Value Analysis
![geogebra-m-value](../docs/readme-pictures/equator-maths/geogebra-m-value.PNG)

Experimental results:
1. ![m-value-experiment-1](../docs/readme-pictures/equator-maths/m-value-experiment-1.PNG)
2. ![m-value-experiment-2](../docs/readme-pictures/equator-maths/m-value-experiment-2.PNG)
3. ![m-value-experiment-3](../docs/readme-pictures/equator-maths/m-value-experiment-3.PNG)

Test marker validation:
![test-marker](../docs/readme-pictures/equator-maths/test-marker.PNG)

### Final Formula
**y = 15 * loge(-0.5x + 45) + 5**

#### Paper Analysis
Original derivation:
![my-paper-sketch](../docs/readme-pictures/equator-maths/my-paper-sketch.PNG)

Component breakdown:
![my-paper-sketch-2](../docs/readme-pictures/equator-maths/my-paper-sketch-2.PNG)

Formula validation:
![my-paper-sketch-equator-proof](../docs/readme-pictures/equator-maths/my-paper-sketch-equation-proof.PNG)

## Implementation Results

### Initial Testing
Single formula plot with highestCityTemperature = 50:
![separate-formula-plot](../docs/readme-pictures/equator-maths/plot-my-formula-separately.PNG)

### Temperature Variable Testing
1. Max Temperature = 10°C:
![result-max-10](../docs/readme-pictures/equator-maths/result1-max-10.PNG)

2. Max Temperature = 20°C:
![result-max-20](../docs/readme-pictures/equator-maths/result1-max-20.PNG)

3. Max Temperature = 100°C (extreme test):
![result-max-100](../docs/readme-pictures/equator-maths/result1-max-100.PNG)

4. Final calibration at 40°C:
![result-max-40](../docs/readme-pictures/equator-maths/result1-max-40.PNG)

## Regional Analysis

### Asia
Linear trend analysis:
![asia-linear-trend](../docs/readme-pictures/equator-solution/asia-linear-trend.PNG)

With logarithmic comparison:
![asia-linear-trend-and-logarithmic](../docs/readme-pictures/equator-solution/asia-linear-trend-and-logarithmic.PNG)

### Europe
Unexpected pattern analysis:
![europe-varying-results](../docs/readme-pictures/equator-solution/europe-varying-results.PNG)

### UTC+1 Zone
Basic trend:
![utc+1-results](../docs/readme-pictures/equator-solution/utc+1-result1.png)

With logarithmic validation:
![utc+1-results-logarithmic](../docs/readme-pictures/equator-solution/utc+1-result1-logarithmic.png)

## Interactive Visualization
![plot-logaritgmic-chart-1](../docs/readme-videos/plot-logarithmic-eq-chart.mp4)
![interact-equator-chart-logarithmic](../docs/readme-videos/interact-equator-chart-logarithmic.mp4)

For more information about related topics:
- [Charts Documentation](./README-CHARTS.md)
- [Development Process](./README-DEVELOPMENT-PROCESS.md) 