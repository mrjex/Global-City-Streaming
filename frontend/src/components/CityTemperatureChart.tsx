'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Import Line component with no SSR
const LineComponent = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  { ssr: false, loading: () => <div className="text-gray-500 italic text-center">Loading chart...</div> }
);

// Import and register Chart.js components
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
  timestamp: number;
}

interface AggregatedDataPoint {
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  count: number;
  timestamp: number;
}

interface ApiResponse {
  dynamicCities: string[];
  temperatureData: TemperatureDataPoint[];
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

// Add these constants at the top
const AGGREGATION_WINDOW = 5000; // 5 seconds window for data aggregation
const MIN_TEMPERATURE = -50; // Minimum expected temperature
const MAX_TEMPERATURE = 50; // Maximum expected temperature

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

  // Add new state for aggregated data
  const [aggregatedData, setAggregatedData] = useState<Record<string, AggregatedDataPoint[]>>({});
  const lastAggregationTime = useRef<number>(Date.now());

  // Add debug state to track API responses
  const [debugInfo, setDebugInfo] = useState<{
    lastApiResponse: any;
    lastProcessedData: any;
    errorMessage: string | null;
  }>({
    lastApiResponse: null,
    lastProcessedData: null,
    errorMessage: null
  });

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

  // Add data aggregation function
  const aggregateData = (data: TemperatureDataPoint[]) => {
    console.log('Aggregating data:', data);
    const currentTime = Date.now();
    const newAggregatedData: Record<string, AggregatedDataPoint[]> = { ...aggregatedData };

    // Group data by city
    const cityGroups = data.reduce((acc, point) => {
      const city = point.city as string;
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(point);
      return acc;
    }, {} as Record<string, TemperatureDataPoint[]>);

    console.log('Grouped data by city:', cityGroups);

    // Process each city's data
    Object.entries(cityGroups).forEach(([city, points]) => {
      if (!newAggregatedData[city]) {
        newAggregatedData[city] = [];
      }

      // Calculate aggregated values
      const temps = points.map(p => p.temperature);
      const aggregatedPoint: AggregatedDataPoint = {
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
        count: temps.length,
        timestamp: currentTime
      };

      console.log(`Aggregated point for ${city}:`, aggregatedPoint);

      // Add new aggregated point
      newAggregatedData[city].push(aggregatedPoint);

      // Keep only the last 4 points
      if (newAggregatedData[city].length > MAX_DATA_POINTS) {
        newAggregatedData[city] = newAggregatedData[city].slice(-MAX_DATA_POINTS);
      }
    });

    return newAggregatedData;
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        console.log('Fetching data from /api/logs...');
        const response = await fetch('/api/logs');
        const data = await response.json() as ApiResponse;
        
        console.log('API Response:', data);
        setDebugInfo(prev => ({ ...prev, lastApiResponse: data }));
        
        const dynamicCities = data?.dynamicCities || [];
        console.log('Dynamic cities from API:', dynamicCities);
        
        if (JSON.stringify(dynamicCities) !== JSON.stringify(currentDynamicCities)) {
          console.log('Dynamic cities changed, resetting state');
          setCityData({});
          setCityColors({});
          setCurrentDynamicCities(dynamicCities);
          setAggregatedData({});
          startTimeRef.current = Date.now();
        }

        if (data && data.temperatureData) {
          console.log('Temperature data received:', data.temperatureData);
          
          // Aggregate the data
          const newAggregatedData = aggregateData(data.temperatureData);
          console.log('New aggregated data:', newAggregatedData);
          setAggregatedData(newAggregatedData);

          // Transform aggregated data for chart display
          setCityData(prevData => {
            const newCityData = { ...prevData };
            
            Object.entries(newAggregatedData).forEach(([city, points]) => {
              if (!newCityData[city]) {
                newCityData[city] = {
                  city: city,
                  timestamps: FIXED_TIMESTAMPS.slice(),
                  temperatures: Array(MAX_DATA_POINTS).fill(points[0]?.avgTemp || 0)
                };
              } else {
                // Update temperatures with aggregated values
                newCityData[city].temperatures = points.map(p => p.avgTemp);
              }
            });

            // Remove cities not in dynamic list
            Object.keys(newCityData).forEach(city => {
              if (!dynamicCities.includes(city)) {
                delete newCityData[city];
              }
            });

            console.log('Transformed city data for chart:', newCityData);
            setDebugInfo(prev => ({ ...prev, lastProcessedData: newCityData }));
            return newCityData;
          });
        } else {
          console.warn('No temperature data received from API');
          setDebugInfo(prev => ({ 
            ...prev, 
            errorMessage: 'No temperature data received from API' 
          }));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setDebugInfo(prev => ({ 
          ...prev, 
          errorMessage: `Error fetching data: ${error instanceof Error ? error.message : String(error)}` 
        }));
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
    const interval = setInterval(fetchAndProcessData, AGGREGATION_WINDOW);
    return () => clearInterval(interval);
  }, [currentDynamicCities]);

  // Set fixed window bounds
  const maxTime = TIME_WINDOW;
  const minTime = 0;

  // Calculate dynamic temperature range from current data
  const temperatures = Object.values(cityData).flatMap(city => city.temperatures);
  console.log('All temperatures for range calculation:', temperatures);
  const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : 0;
  const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : 30;
  
  // Add padding to the range (10% of the range on each side)
  const range = maxTemp - minTemp;
  const padding = range * 0.1;
  const dynamicMinTemp = minTemp - padding;
  const dynamicMaxTemp = maxTemp + padding;

  console.log('Temperature range:', { minTemp, maxTemp, dynamicMinTemp, dynamicMaxTemp });

  // Prepare data for Chart.js
  const chartData = {
    datasets: Object.entries(cityData).map(([cityName, data]) => {
      const baseColor = getColorForCity(cityName);
      console.log(`Preparing dataset for ${cityName}:`, {
        temperatures: data.temperatures,
        timestamps: data.timestamps
      });
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
  
  console.log('Final chart data:', chartData);
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750, // Longer animation duration
      easing: 'easeInOutQuart', // Smooth easing function
      animations: {
        numbers: {
          type: 'number',
          duration: 750,
        },
        x: {
          type: 'number',
          duration: 750,
        },
        y: {
          type: 'number',
          duration: 750,
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
            <>
              <LineComponent 
                data={chartData} 
                options={chartOptions}
                redraw={false}
              />
              {/* Debug panel */}
              <div className="mt-4 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-auto max-h-40">
                <div className="font-bold">Debug Info:</div>
                <div>Dynamic Cities: {currentDynamicCities.join(', ') || 'None'}</div>
                <div>City Data Keys: {Object.keys(cityData).join(', ') || 'None'}</div>
                <div>Datasets: {chartData.datasets.length}</div>
                {debugInfo.errorMessage && (
                  <div className="text-red-400">Error: {debugInfo.errorMessage}</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityTemperatureChart; 