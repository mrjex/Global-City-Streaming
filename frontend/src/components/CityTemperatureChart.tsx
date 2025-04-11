'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import Line component with no SSR
const Line = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  { ssr: false, loading: () => <div className="text-gray-500 italic text-center">Loading chart...</div> }
);

// Import and register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CityTemperatureData {
  city: string;
  timestamps: number[];
  temperatures: number[];
}

interface TemperatureDataPoint {
  city: string;
  temperature: number;
  timestamp: string;
}

interface CityTemperatureChartProps {
  title?: string;
}

// Window size in seconds - reduced to show less data points
const TIME_WINDOW = 4;  // Change to 4 fixed points
const MAX_DATA_POINTS = 4;
const FIXED_TIMESTAMPS = [1, 2, 3, 4];  // Fixed timestamp positions

// Add these constants at the top with other constants
const TEMPERATURE_VARIANCE = 0.5; // Maximum temperature change in °C between points
const FALLBACK_UPDATE_THRESHOLD = 2000; // ms before using fallback if no new data
const REQUIRED_TIMESTAMPS = [0, 1, 2, 3, 4]; // Timestamps we want to ensure are covered

// Add this constant to control how many points we want across the window
const POINTS_PER_WINDOW = 5; // One point per second in our 5-second window

// Add polling interval constant
const POLLING_INTERVAL = 1000; // Milliseconds between data fetches

// Add these constants at the top
const RANDOMIZATION_CHANCE = 0.2; // 30% chance to randomize any given update

// Define sophisticated color palette (pastel/jewel tones)
const CHART_COLORS = [
  'hsla(350, 70%, 70%, 1)', // Soft Rose
  'hsla(190, 75%, 60%, 1)', // Soft Azure
  'hsla(150, 65%, 65%, 1)', // Mint Green
  'hsla(280, 60%, 70%, 1)', // Lavender
  'hsla(35, 80%, 75%, 1)',  // Peach
  'hsla(210, 70%, 65%, 1)', // Sky Blue
  'hsla(320, 65%, 65%, 1)'  // Pink Orchid
];

// Add this at the top with other constants
const log = (message: string, data?: any) => {
  if (data) {
    console.log(`LINE CHART LOG: ${message}`, data);
  } else {
    console.log(`LINE CHART LOG: ${message}`);
  }
};

const CityTemperatureChart: React.FC<CityTemperatureChartProps> = ({
  title = 'Dynamic City Temperatures'
}) => {
  const [cityData, setCityData] = useState<Record<string, CityTemperatureData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const currentTimeRef = useRef<number>(0);
  const [cityColors, setCityColors] = useState<Record<string, string>>({});
  const [currentDynamicCities, setCurrentDynamicCities] = useState<string[]>([]);
  const lastKnownTemperatures = useRef<Record<string, { temp: number; timestamp: number }>>({});
  const lastCountryChangeTime = useRef<number>(Date.now());
  const isProcessingCountryChange = useRef<boolean>(false);

  // Add this function to validate temperature data
  const isValidTemperatureData = (data: any) => {
    return (
      data &&
      Array.isArray(data.temperatureData) &&
      data.temperatureData.length > 0 &&
      Array.isArray(data.dynamicCities) &&
      data.dynamicCities.length > 0
    );
  };

  // Add this function to check if we have data for all cities
  const hasDataForAllCities = (data: any) => {
    if (!data?.dynamicCities || !data?.temperatureData) return false;
    return data.dynamicCities.every(city => 
      data.temperatureData.some(point => 
        point.city === city && 
        typeof point.temperature === 'number'
      )
    );
  };

  // Add this new effect to handle country changes
  useEffect(() => {
    const checkCountryChange = async () => {
      try {
        const response = await fetch('/api/selected-country');
        const data = await response.json();
        const currentTime = Date.now();
        
        if (data.country) {
          log('Checking country change', {
            current: currentDynamicCities,
            newCountry: data.country,
            timeSinceLastChange: currentTime - lastCountryChangeTime.current,
            isProcessing: isProcessingCountryChange.current
          });

          // If we're in the middle of processing a change, skip this cycle
          if (isProcessingCountryChange.current) {
            log('Still processing previous country change, skipping');
            return;
          }

          // If this is a new country change
          if (data.country !== lastCountryChangeTime.current) {
            log('Country changed - waiting for data to stabilize');
            isProcessingCountryChange.current = true;
            lastCountryChangeTime.current = currentTime;
            
            // Clear existing data
            setCityData({});
            setCityColors({});
            setCurrentDynamicCities([]);
            
            // Wait for Kafka producer to start generating new data
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            isProcessingCountryChange.current = false;
            log('Ready to process new country data');
          }
        }
      } catch (error) {
        log('Error checking country change', error);
      }
    };

    const interval = setInterval(checkCountryChange, 1000);
    return () => clearInterval(interval);
  }, []);

  // Modify getColorForCity to use city index from dynamic cities list
  const getColorForCity = (city: string) => {
    if (cityColors[city]) return cityColors[city];
    
    // Get index of city in dynamic cities list
    const cityIndex = currentDynamicCities.indexOf(city);
    const colorIndex = Math.max(0, cityIndex) % CHART_COLORS.length;
    const newColor = CHART_COLORS[colorIndex];
    
    setCityColors(prev => ({ ...prev, [city]: newColor }));
    return newColor;
  };

  // Create gradient background function
  const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    const transparentColor = color.replace('1)', '0.1)');
    gradient.addColorStop(0, transparentColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    return gradient;
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        // Skip if we're processing a country change
        if (isProcessingCountryChange.current) {
          log('Skipping data fetch - country change in progress');
          return;
        }

        log('=== Starting data fetch cycle ===');
        const response = await fetch('/api/logs');
        const rawData = await response.json();

        // Log raw data received
        log('Raw data received from API:', rawData);

        // Parse the logs string into proper data structure
        let data;
        try {
          // The logs might contain multiple log entries
          const logsContent = rawData.logs.trim();
          log('Processing logs content:', logsContent);
          
          // Try to extract a JSON object containing cities data
          if (logsContent.includes('"cities"')) {
            log('Found cities data in logs');
            
            // Try different regex patterns to extract the JSON
            // This pattern looks for a JSON object with cities field
            const citiesMatch = logsContent.match(/({[\s\S]*"cities"[\s\S]*})/);
            
            if (citiesMatch && citiesMatch[1]) {
              try {
                // Clean up the JSON string
                let citiesJson = citiesMatch[1]
                  .replace(/\n/g, '')
                  .replace(/\r/g, '')
                  .trim();
                
                log('Attempting to parse cities JSON:', citiesJson);
                const parsedData = JSON.parse(citiesJson);
                
                if (parsedData.cities) {
                  log('Successfully parsed cities data:', parsedData);
                  
                  // Transform the data into the expected format
                  const dynamicCities = Object.keys(parsedData.cities);
                  const temperatureData = dynamicCities.map(city => ({
                    city: city,
                    temperature: parsedData.cities[city].temperatureCelsius,
                    timestamp: new Date().toISOString()
                  }));
                  
                  data = {
                    temperatureData,
                    dynamicCities
                  };
                }
              } catch (parseError) {
                log('Error parsing cities JSON:', parseError);
              }
            }
          }
          
          // If we couldn't parse cities data, try looking for individual city log entries
          if (!data && logsContent.includes('Sent data for')) {
            log('Looking for individual city log entries');
            
            // Extract all city data entries using regex
            // Match the format we see in the logs: [2025-04-11 13:02:38] Sent data for Stockholm: {"city": "Stockholm", ...}
            const cityEntries = logsContent.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] Sent data for .+?: ({.+?})/g);
            
            if (cityEntries && cityEntries.length > 0) {
              log(`Found ${cityEntries.length} city entries`);
              
              const temperatureData: TemperatureDataPoint[] = [];
              const dynamicCities: string[] = [];
              
              // Process each city entry
              cityEntries.forEach(entry => {
                try {
                  // Extract the JSON part
                  const jsonMatch = entry.match(/({.+?})/);
                  if (jsonMatch && jsonMatch[1]) {
                    const cityJson = jsonMatch[1];
                    log('Extracted city JSON:', cityJson);
                    const parsedCity = JSON.parse(cityJson);
                    
                    if (parsedCity.city && typeof parsedCity.temperatureCelsius === 'number') {
                      temperatureData.push({
                        city: parsedCity.city,
                        temperature: parsedCity.temperatureCelsius,
                        timestamp: new Date().toISOString()
                      });
                      
                      if (!dynamicCities.includes(parsedCity.city)) {
                        dynamicCities.push(parsedCity.city);
                      }
                    }
                  }
                } catch (entryError) {
                  log(`Error parsing city entry: ${entry}`, entryError);
                }
              });
              
              if (temperatureData.length > 0) {
                log(`Successfully parsed ${temperatureData.length} temperature data points for ${dynamicCities.length} cities`);
                data = { temperatureData, dynamicCities };
              }
            }
          }
          
          // If we still don't have data, try looking for single city data
          if (!data) {
            log('Trying to parse single city data');
            
            // Look for a pattern that resembles a city data JSON
            const cityMatch = logsContent.match(/{[\s\S]*?"city"[\s\S]*?}/);
            
            if (cityMatch) {
              try {
                const cityJson = cityMatch[0];
                log('Attempting to parse single city JSON:', cityJson);
                
                const parsedCity = JSON.parse(cityJson);
                
                if (parsedCity.city && typeof parsedCity.temperatureCelsius === 'number') {
                  log('Successfully parsed single city data:', parsedCity);
                  
                  data = {
                    temperatureData: [{
                      city: parsedCity.city,
                      temperature: parsedCity.temperatureCelsius,
                      timestamp: new Date().toISOString()
                    }],
                    dynamicCities: [parsedCity.city]
                  };
                }
              } catch (singleCityError) {
                log('Error parsing single city data:', singleCityError);
              }
            }
          }
          
          // If we couldn't parse the data in any format, log the issue
          if (!data) {
            log('Could not extract valid JSON from logs');
            log('Raw logs:', logsContent);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          log('Error in overall parsing process:', error);
          setIsLoading(false);
          return;
        }

        // Validate the transformed data structure
        if (!isValidTemperatureData(data)) {
          log('Invalid or incomplete transformed data. Data structure:', {
            hasTemperatureData: Boolean(data?.temperatureData),
            temperatureDataLength: data?.temperatureData?.length,
            hasDynamicCities: Boolean(data?.dynamicCities),
            dynamicCitiesLength: data?.dynamicCities?.length
          });
          setIsLoading(false);
          return;
        }

        // Log the dynamic cities and their temperature data
        log('Dynamic cities received:', data.dynamicCities);
        log('Temperature data points:', data.temperatureData.map(point => ({
          city: point.city,
          temp: point.temperature,
          timestamp: point.timestamp
        })));

        // Check if we have data for all cities
        const hasAllCityData = hasDataForAllCities(data);
        log('Data completeness check', {
          hasAllCityData,
          dynamicCities: data.dynamicCities,
          citiesWithTemps: data.temperatureData.map(p => p.city),
          missingCities: data.dynamicCities.filter(city => 
            !data.temperatureData.some(p => p.city === city && typeof p.temperature === 'number')
          )
        });

        // Only process data if we have it for all cities
        if (hasAllCityData) {
          log('Processing data for all cities');
          setCityData(prevData => {
            const newCityData = { ...prevData };
            const currentTime = Date.now();
            
            // Remove cities not in dynamic list
            Object.keys(newCityData).forEach(city => {
              if (!data.dynamicCities.includes(city)) {
                log(`Removing city ${city} - no longer in dynamic list`);
                delete newCityData[city];
              }
            });
            
            // Process each city's data
            data.dynamicCities.forEach(city => {
              const cityPoints = data.temperatureData.filter(point => point.city === city);
              const latestPoint = cityPoints[0];
              
              if (latestPoint && typeof latestPoint.temperature === 'number') {
                // Apply randomization with probability RANDOMIZATION_CHANCE
                let temperature = latestPoint.temperature;
                if (Math.random() < RANDOMIZATION_CHANCE) {
                  // Generate random variance between -TEMPERATURE_VARIANCE and +TEMPERATURE_VARIANCE
                  const randomVariance = (Math.random() * 2 - 1) * TEMPERATURE_VARIANCE;
                  temperature += randomVariance;
                  log(`Randomized temperature for ${city}: ${latestPoint.temperature.toFixed(1)} → ${temperature.toFixed(1)}`);
                }
                
                if (!newCityData[city]) {
                  // Initialize new city data
                  newCityData[city] = {
                    city,
                    timestamps: FIXED_TIMESTAMPS.slice(),
                    temperatures: Array(MAX_DATA_POINTS).fill(temperature)
                  };
                  log(`Initialized data for ${city} with temperature ${temperature}`);
                } else {
                  // Update existing city data
                  newCityData[city].temperatures = [
                    ...newCityData[city].temperatures.slice(1),
                    temperature
                  ];
                  log(`Updated data for ${city} with new temperature ${temperature}`);
                }
              }
            });
            
            log('New city data:', newCityData);
            return newCityData;
          });

          // Update current dynamic cities
          setCurrentDynamicCities(data.dynamicCities);
          log('Updated current dynamic cities:', data.dynamicCities);
        } else {
          log('Not processing data - missing data for some cities');
        }

        setIsLoading(false);
        log('Loading state set to false');
      } catch (error) {
        log('Error in data fetch cycle', error);
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
    const interval = setInterval(fetchAndProcessData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [currentDynamicCities]);

  // Set fixed window bounds
  const maxTime = TIME_WINDOW;
  const minTime = 0;

  // Calculate dynamic temperature range from current data
  const temperatures = Object.values(cityData).flatMap(city => city.temperatures);
  
  // Only proceed with calculations if we have data
  let minTemp, maxTemp;
  
  if (temperatures.length > 0) {
    // Find the actual min and max values
    minTemp = Math.min(...temperatures);
    maxTemp = Math.max(...temperatures);
    
    // Ensure there's always some range to display (prevent flat line)
    if (minTemp === maxTemp) {
      minTemp -= 1;
      maxTemp += 1;
    } else {
      // Add padding as a percentage of the actual range
      const range = maxTemp - minTemp;
      const paddingAmount = range * 0.1; // 10% padding
      minTemp -= paddingAmount;
      maxTemp += paddingAmount;
    }
  }
  
  log('Temperature range calculation:', { 
    dataPoints: temperatures.length,
    minTemp,
    maxTemp
  });
  
  // Prepare data for Chart.js
  const chartData = {
    datasets: Object.entries(cityData).map(([cityName, data]) => {
      const baseColor = getColorForCity(cityName);
      return {
        label: cityName,
        data: data.temperatures.map((temp, idx) => ({
          x: data.timestamps[idx],
          y: temp
        })),
        borderColor: baseColor,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          return createGradient(ctx, baseColor);
        },
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: baseColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        cubicInterpolationMode: 'monotone',
        fill: true, // Enable fill for gradient
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 4
      };
    })
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500, // Longer animation duration for smoother transitions
      easing: 'easeOutQuart', // Smooth easing function
      animations: {
        y: {
          easing: 'easeInOutCubic',
          duration: 2000, // Even longer for y-axis to prevent jerky movements
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        cubicInterpolationMode: 'monotone',
        // Add shadow to lines
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 4
      },
      point: {
        radius: 6,  // Larger points
        hitRadius: 12,
        hoverRadius: 8,
        // Add glow effect to points
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBackgroundColor: 'white',
        pointStyle: 'circle',
        // Add shadow/glow
        shadowColor: 'rgba(255, 255, 255, 0.5)',
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Time (seconds)',
          color: '#ddd'
        },
        min: 1,
        max: 4,
        ticks: {
          color: '#ddd',
          stepSize: 1,
          callback: (value: number) => value.toFixed(0)
        },
        grid: {
          color: '#444',
          drawOnChartArea: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#ddd'
        },
        // Use suggestedMin and suggestedMax instead of strict min/max
        // This allows Chart.js to adapt while still following our guidance
        suggestedMin: minTemp,
        suggestedMax: maxTemp,
        ticks: {
          color: '#ddd',
          callback: (value: number) => value.toFixed(1) + '°C'
        },
        grid: {
          color: '#444',
          drawOnChartArea: true
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#ddd',
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + '°C';
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-gray-800 px-4 py-2">
          <div className="text-gray-400 text-sm text-center">{title}</div>
        </div>
        <div className="p-4" style={{ backgroundColor: '#1a1b1e', height: '460px' }}>
          {isLoading ? (
            <div className="text-gray-500 italic text-center">Loading data...</div>
          ) : (
            <Line 
              data={chartData} 
              options={chartOptions}
              redraw={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CityTemperatureChart; 