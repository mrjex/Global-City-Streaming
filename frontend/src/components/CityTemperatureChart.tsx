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
const DEFAULT_CITIES = ['London', 'Stockholm', 'Moscow'];

// Colors for each city
const CITY_COLORS: Record<string, string> = {
  'London': 'rgb(75, 192, 192)',
  'Stockholm': 'rgb(153, 102, 255)',
  'Moscow': 'rgb(255, 99, 132)'
};

// Window size in seconds
const TIME_WINDOW = 10;

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
                  
                  if (jsonData.city && jsonData.temperature && DEFAULT_CITIES.includes(jsonData.city)) {
                    const city = jsonData.city;
                    const temperature = parseFloat(jsonData.temperature);
                    
                    if (!isNaN(temperature)) {
                      if (!newCityData[city]) {
                        newCityData[city] = {
                          city,
                          timestamps: [],
                          temperatures: []
                        };
                      }
                      
                      // Add new data point with the current time
                      newCityData[city].timestamps.push(currentTimeRef.current);
                      newCityData[city].temperatures.push(temperature);
                      
                      // Remove data points outside the time window
                      const cutoffTime = currentTimeRef.current - TIME_WINDOW;
                      let i = 0;
                      while (i < newCityData[city].timestamps.length && newCityData[city].timestamps[i] < cutoffTime) {
                        i++;
                      }
                      
                      if (i > 0) {
                        newCityData[city].timestamps = newCityData[city].timestamps.slice(i);
                        newCityData[city].temperatures = newCityData[city].temperatures.slice(i);
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

    // Poll for updates every 250ms
    const interval = setInterval(fetchAndProcessLogs, 250);

    return () => clearInterval(interval);
  }, []);

  // Calculate time window bounds
  const maxTime = currentTimeRef.current;
  const minTime = Math.max(0, maxTime - TIME_WINDOW);

  // Prepare data for Chart.js
  const chartData = {
    datasets: Object.entries(cityData).map(([cityName, city]) => {
      return {
        label: cityName,
        data: city.temperatures.map((temp, idx) => ({
          x: city.timestamps[idx],
          y: temp
        })),
        borderColor: CITY_COLORS[cityName] || 'rgb(200, 200, 200)',
        backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent background
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3, // Add curve for smoothing line
        fill: false
      };
    })
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 100 // Fast animations for smoothness
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
          stepSize: 1,
          callback: (value: number) => value.toFixed(1)
        },
        grid: {
          color: '#444'
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
          stepSize: 5
        },
        grid: {
          color: '#444'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#ddd'
        }
      },
      tooltip: {
        mode: 'index',
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