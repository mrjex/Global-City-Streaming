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
  timestamp: string;
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

// Update these constants to better reflect our approach
const TIME_WINDOW = 4;  // Keep 4 seconds window
const MAX_DATA_POINTS = 4;
const FIXED_TIMESTAMPS = [1, 2, 3, 4];  // Fixed timestamp positions

// Update polling interval to 1 second
const POLLING_INTERVAL = 1000; // 1 second between data fetches

// Add these constants at the top with other constants
const TEMPERATURE_VARIANCE = 0.5; // Maximum temperature change in °C between points
const FALLBACK_UPDATE_THRESHOLD = 2000; // ms before using fallback if no new data
const REQUIRED_TIMESTAMPS = [0, 1, 2, 3, 4]; // Timestamps we want to ensure are covered

// Add this constant to control how many points we want across the window
const POINTS_PER_WINDOW = 5; // One point per second in our 5-second window

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

  // Add this new state for tracking selected country
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [shouldRefreshData, setShouldRefreshData] = useState<boolean>(true);

  // Add this useEffect to listen for country changes
  useEffect(() => {
    const checkSelectedCountry = async () => {
      try {
        const response = await fetch('/api/selected-country');
        const data = await response.json();
        if (data.country !== selectedCountry) {
          console.log('Country changed from', selectedCountry, 'to', data.country);
          setSelectedCountry(data.country);
          setShouldRefreshData(true); // Trigger a data refresh
        }
      } catch (error) {
        console.error('Error checking selected country:', error);
      }
    };

    // Check immediately and set up interval
    checkSelectedCountry();
    const countryCheckInterval = setInterval(checkSelectedCountry, 1000);
    return () => clearInterval(countryCheckInterval);
  }, [selectedCountry]);

  // Modify the data fetching useEffect
  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        console.log('Fetching data from /api/logs...');
        const response = await fetch('/api/logs');
        const data = await response.json() as ApiResponse;
        
        console.log('Raw API Response:', data);
        
        // Extract dynamic cities
        const dynamicCities = data?.dynamicCities || [];
        console.log('Dynamic cities from API:', dynamicCities);
        
        // Reset data if country changed
        if (shouldRefreshData) {
          console.log('Resetting data due to country change');
          setCityData({});
          setCityColors({});
          setShouldRefreshData(false);
        }
        
        // Update dynamic cities list
        setCurrentDynamicCities(dynamicCities);
        
        if (data?.temperatureData && data.temperatureData.length > 0) {
          console.log('Processing temperature data:', data.temperatureData.length, 'points');
          
          const newCityData: Record<string, CityTemperatureData> = {};
          
          // Process each dynamic city
          dynamicCities.forEach(city => {
            const cityPoints = data.temperatureData
              .filter(point => point.city === city)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, MAX_DATA_POINTS);
              
            if (cityPoints.length > 0) {
              console.log(`Found ${cityPoints.length} points for ${city}`);
              newCityData[city] = {
                city,
                timestamps: FIXED_TIMESTAMPS.slice(),
                temperatures: cityPoints.map(p => p.temperature)
              };
            }
          });
          
          if (Object.keys(newCityData).length > 0) {
            console.log('Updating chart with new data:', Object.keys(newCityData));
            setCityData(prev => ({
              ...prev,
              ...newCityData
            }));
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    // Set up polling interval
    const dataFetchInterval = setInterval(fetchAndProcessData, POLLING_INTERVAL);
    fetchAndProcessData(); // Initial fetch
    
    return () => clearInterval(dataFetchInterval);
  }, [selectedCountry, shouldRefreshData]); // Add shouldRefreshData as dependency

  // Modify the existing data fetching useEffect to depend on selectedCountry
  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        console.log('Fetching data from /api/logs...');
        const response = await fetch('/api/logs');
        const data = await response.json() as ApiResponse;
        
        console.log('Raw API Response:', data);
        
        // Extract and set dynamic cities first
        const dynamicCities = data?.dynamicCities || [];
        console.log('Dynamic cities from API:', dynamicCities);
        
        // Always update dynamic cities list
        setCurrentDynamicCities(dynamicCities);
        
        if (data?.temperatureData && data.temperatureData.length > 0) {
          console.log('Temperature data received:', data.temperatureData.length, 'points');
          
          // Create entries for ALL dynamic cities, even if they don't have data yet
          const newCityData: Record<string, CityTemperatureData> = {};
          
          // Initialize data structure for all dynamic cities
          dynamicCities.forEach(city => {
            console.log(`Processing city: ${city}`);
            const cityPoints = data.temperatureData.filter(point => point.city === city);
            console.log(`Found ${cityPoints.length} points for ${city}`);
            
            // Sort points by timestamp (newest first)
            cityPoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            // Take up to MAX_DATA_POINTS recent points
            const recentPoints = cityPoints.slice(0, MAX_DATA_POINTS);
            
            // Always create an entry for the city, even if no data points yet
            newCityData[city] = {
              city,
              timestamps: FIXED_TIMESTAMPS.slice(),
              temperatures: recentPoints.map(p => p.temperature)
            };
            
            console.log(`Created data entry for ${city}:`, newCityData[city]);
          });
          
          console.log('Final processed city data:', newCityData);
          setCityData(newCityData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
    const dataFetchInterval = setInterval(fetchAndProcessData, POLLING_INTERVAL);
    return () => clearInterval(dataFetchInterval);
  }, [selectedCountry]); // Add selectedCountry as dependency

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
    console.log('Aggregating data, received points:', data.length);
    
    // Group data by city
    const cityGroups: Record<string, TemperatureDataPoint[]> = {};
    
    // Group data by city
    data.forEach(point => {
      const city = point.city;
      if (!cityGroups[city]) {
        cityGroups[city] = [];
      }
      cityGroups[city].push(point);
    });

    console.log('Grouped data by city:', Object.keys(cityGroups));

    // For each city, sample one point per second if available
    const sampledData: Record<string, TemperatureDataPoint[]> = {};
    
    Object.entries(cityGroups).forEach(([city, points]) => {
      sampledData[city] = [];
      
      // Sort points by timestamp (newest first)
      points.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Take the most recent 4 points (or less if not available)
      const recentPoints = points.slice(0, MAX_DATA_POINTS);
      
      sampledData[city] = recentPoints;
      console.log(`Sampled ${recentPoints.length} recent points for ${city}`);
    });

    return sampledData;
  };

  // Add this function to filter data for relevant cities
  const filterAndGroupData = (data: TemperatureDataPoint[], dynamicCities: string[]) => {
    // Only include data for the dynamic cities
    const relevantData = data.filter(point => dynamicCities.includes(point.city));
    console.log(`Filtered ${data.length} points to ${relevantData.length} relevant points for dynamic cities`);
    
    // Group by city
    const cityGroups: Record<string, TemperatureDataPoint[]> = {};
    dynamicCities.forEach(city => {
      cityGroups[city] = relevantData.filter(point => point.city === city);
      console.log(`Found ${cityGroups[city].length} data points for ${city}`);
    });
    
    return cityGroups;
  };

  // Set fixed window bounds
  const maxTime = TIME_WINDOW;
  const minTime = 0;

  // Calculate dynamic temperature range from current data
  const temperatures = Object.values(cityData as Record<string, CityTemperatureData>)
    .flatMap(city => city.temperatures);
  console.log('All temperatures for range calculation:', temperatures);
  const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : 0;
  const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : 30;
  
  // Add padding to the range (10% of the range on each side)
  const range = maxTemp - minTemp;
  const padding = range * 0.1;
  const dynamicMinTemp = minTemp - padding;
  const dynamicMaxTemp = maxTemp + padding;

  console.log('Temperature range:', { minTemp, maxTemp, dynamicMinTemp, dynamicMaxTemp });

  // Update the chartData preparation
  const chartData = {
    datasets: Object.entries(cityData)
      .filter(([_, data]) => data.temperatures && data.temperatures.length > 0)
      .map(([cityName, data]) => {
        const baseColor = getColorForCity(cityName);
        console.log(`Creating dataset for ${cityName} with ${data.temperatures.length} points`);
        
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
          fill: true
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