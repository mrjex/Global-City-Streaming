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
  timestamps: number[]; // Relative time in seconds since start
  temperatures: number[];
}

interface CityTemperatureChartProps {
  title?: string;
}

// Only display these 3 default cities
const DEFAULT_CITIES = ['London', 'Stockholm', 'Venice'];

// Colors for each city
const CITY_COLORS: Record<string, string> = {
  'London': 'rgb(75, 192, 192)',
  'Stockholm': 'rgb(153, 102, 255)',
  'Venice': 'rgb(255, 99, 132)'
};

// Window size in seconds - reduced to show less data points
const TIME_WINDOW = 5;

// Maximum number of data points per city
const MAX_DATA_POINTS = 10;

// Y-axis limits for better visualization
const MIN_TEMP = -15;
const MAX_TEMP = 45;

const CityTemperatureChart: React.FC<CityTemperatureChartProps> = ({
  title = 'City Temperatures'
}) => {
  const [cityData, setCityData] = useState<Record<string, CityTemperatureData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const currentTimeRef = useRef<number>(0);

  useEffect(() => {
    // Initialize with empty data for each city
    const initialData: Record<string, CityTemperatureData> = {};
    DEFAULT_CITIES.forEach(city => {
      initialData[city] = {
        city,
        timestamps: [],
        temperatures: []
      };
    });
    setCityData(initialData);
    
    const fetchAndProcessLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        const data = await response.text();
        
        // Update current time
        currentTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
        
        if (data && data !== '[]') {
          const allLogs = data.split('\n').filter(line => line.trim());
          
          // Process logs to extract city temperature data
          setCityData(prevData => {
            const newCityData = { ...prevData };
            
            allLogs.forEach(log => {
              // Match the specific log format from python-producer.py:
              // [timestamp] Sent data: {"city": "CityName", "temperature": "23.45"}
              const jsonMatch = log.match(/Sent data: (\{.*\})/);
              
              if (jsonMatch) {
                try {
                  const jsonData = JSON.parse(jsonMatch[1]);
                  const cityName = jsonData.city === 'Moscow' ? 'Venice' : jsonData.city;
                  
                  if (jsonData.city && jsonData.temperature && DEFAULT_CITIES.includes(cityName)) {
                    const city = cityName;
                    const temperature = parseFloat(jsonData.temperature);
                    
                    if (!isNaN(temperature)) {
                      if (!newCityData[city]) {
                        newCityData[city] = {
                          city,
                          timestamps: [],
                          temperatures: []
                        };
                      }
                      
                      // Only add a new data point if there's a significant change in time
                      // or it's the first data point for this city
                      const lastTimestamp = newCityData[city].timestamps.length > 0 
                        ? newCityData[city].timestamps[newCityData[city].timestamps.length - 1] 
                        : 0;
                        
                      // Add data point if it's the first one or at least 0.5 second has passed
                      if (newCityData[city].timestamps.length === 0 || 
                          (currentTimeRef.current - lastTimestamp) >= 0.5) {
                        
                        // Add new data point with the current time
                        newCityData[city].timestamps.push(currentTimeRef.current);
                        newCityData[city].temperatures.push(temperature);
                        
                        // Limit number of data points
                        if (newCityData[city].timestamps.length > MAX_DATA_POINTS) {
                          newCityData[city].timestamps = newCityData[city].timestamps.slice(-MAX_DATA_POINTS);
                          newCityData[city].temperatures = newCityData[city].temperatures.slice(-MAX_DATA_POINTS);
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error parsing JSON from logs:', error);
                }
              }
            });
            
            return newCityData;
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAndProcessLogs();

    // Poll for updates every 100ms (increased from 250ms)
    const interval = setInterval(fetchAndProcessLogs, 100);

    return () => clearInterval(interval);
  }, []);

  // Calculate time window bounds
  const maxTime = currentTimeRef.current;
  const minTime = Math.max(0, maxTime - TIME_WINDOW);

  // Prepare data for Chart.js
  const chartData = {
    datasets: Object.entries(cityData).map(([cityName, data]) => {
      const city = data as CityTemperatureData;
      return {
        label: cityName,
        data: city.temperatures.map((temp, idx) => ({
          x: city.timestamps[idx],
          y: temp
        })),
        borderColor: CITY_COLORS[cityName] || 'rgb(200, 200, 200)',
        backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent background
        borderWidth: 3,
        pointRadius: 0, // Hide points for a cleaner look
        tension: 0.4, // Increased smoothing for better curves
        fill: false
      };
    })
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animations for smoother real-time updates
    },
    elements: {
      line: {
        tension: 0.4 // Smooth out the lines
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
        min: minTime,
        max: maxTime,
        ticks: {
          color: '#ddd',
          maxTicksLimit: 5, // Limit number of ticks for cleaner x-axis
          callback: (value: number) => value.toFixed(0)
        },
        grid: {
          color: '#444',
          drawOnChartArea: false // Only show grid at axes
        }
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#ddd'
        },
        min: MIN_TEMP,
        max: MAX_TEMP,
        ticks: {
          color: '#ddd',
          stepSize: 10 // Larger steps for cleaner y-axis
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