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

  // Generate a color for a new city
  const getColorForCity = (city: string) => {
    if (cityColors[city]) return cityColors[city];
    
    const hue = Math.random() * 360;
    const color = `hsl(${hue}, 70%, 50%)`;
    setCityColors(prev => ({ ...prev, [city]: color }));
    return color;
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        
        // Safely get dynamic cities with a default empty array
        const dynamicCities = data?.dynamicCities || [];
        
        // Check if dynamic cities have changed
        if (JSON.stringify(dynamicCities) !== JSON.stringify(currentDynamicCities)) {
          // Clear old data when cities change
          setCityData({});
          setCityColors({});
          setCurrentDynamicCities(dynamicCities);
          startTimeRef.current = Date.now(); // Reset start time
        }
        
        // Update current time and wrap it within TIME_WINDOW
        currentTimeRef.current = ((Date.now() - startTimeRef.current) / 1000) % TIME_WINDOW;
        
        if (data && data.temperatureData) {
          setCityData(prevData => {
            const newCityData = { ...prevData };
            const currentTime = Date.now();
            
            // Remove cities not in dynamic list
            Object.keys(newCityData).forEach(city => {
              if (!dynamicCities.includes(city)) {
                delete newCityData[city];
                delete lastKnownTemperatures.current[city];
              }
            });
            
            // Initialize or update each city's data
            dynamicCities.forEach(city => {
              // Find the latest real temperature for this city
              const cityData = data.temperatureData.find(point => point.city === city);
              let currentTemp;
              
              if (cityData) {
                currentTemp = cityData.temperature;
                lastKnownTemperatures.current[city] = {
                  temp: currentTemp,
                  timestamp: currentTime
                };
              } else if (lastKnownTemperatures.current[city]) {
                // Use last known temperature with small variance
                const variance = (Math.random() * 2 - 1) * TEMPERATURE_VARIANCE;
                currentTemp = lastKnownTemperatures.current[city].temp + variance;
                console.log(`RANDOMIZATION: City ${city} - Base temp: ${lastKnownTemperatures.current[city].temp}, Variance: ${variance.toFixed(2)}, New temp: ${currentTemp.toFixed(2)}`);
              } else {
                // Default temperature for new cities
                currentTemp = 20;
              }

              // Randomly decide if we should replace this real reading
              if (Math.random() < RANDOMIZATION_CHANCE) {
                const variance = (Math.random() * 2 - 1) * TEMPERATURE_VARIANCE;
                const randomizedTemp = currentTemp + variance;
                console.log(`RANDOMIZATION: City ${city} - Real temp: ${currentTemp}, Variance: ${variance.toFixed(2)}, Randomized temp: ${randomizedTemp.toFixed(2)}`);
                currentTemp = randomizedTemp;
              }

              if (!newCityData[city]) {
                // Initialize with all timestamps but same temperature
                newCityData[city] = {
                  city: city,
                  timestamps: FIXED_TIMESTAMPS.slice(),
                  temperatures: Array(MAX_DATA_POINTS).fill(currentTemp)
                };
              } else {
                // Shift all temperatures left and add new temperature at the end
                newCityData[city].temperatures = [
                  ...newCityData[city].temperatures.slice(1),
                  currentTemp
                ];
                // Keep timestamps fixed
                newCityData[city].timestamps = FIXED_TIMESTAMPS.slice();
              }
            });
            
            return newCityData;
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
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
  const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : 0;
  const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : 30;
  
  // Add padding to the range (10% of the range on each side)
  const range = maxTemp - minTemp;
  const padding = range * 0.1;
  const dynamicMinTemp = minTemp - padding;
  const dynamicMaxTemp = maxTemp + padding;

  // Prepare data for Chart.js
  const chartData = {
    datasets: Object.entries(cityData).map(([cityName, data]) => ({
      label: cityName,
      data: data.temperatures.map((temp, idx) => ({
        x: data.timestamps[idx],
        y: temp
      })),
      borderColor: getColorForCity(cityName),
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 3,
      pointRadius: 6,  // Increased point size
      pointBackgroundColor: getColorForCity(cityName),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.4,  // Add tension for smoothing
      cubicInterpolationMode: 'monotone',  // Smooth interpolation
      fill: false,
      // Add shadow effect
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 4
    }))
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
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
        min: dynamicMinTemp,
        max: dynamicMaxTemp,
        ticks: {
          color: '#ddd',
          stepSize: Math.max(1, Math.ceil((dynamicMaxTemp - dynamicMinTemp) / 5))
        },
        grid: {
          color: '#444',
          drawOnChartArea: false // Only show grid at axes
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