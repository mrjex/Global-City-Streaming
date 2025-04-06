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
const TIME_WINDOW = 5;

// Maximum number of data points per city
const MAX_DATA_POINTS = 10;

// Y-axis limits for better visualization
const MIN_TEMP = -15;
const MAX_TEMP = 45;

const CityTemperatureChart: React.FC<CityTemperatureChartProps> = ({
  title = 'Dynamic City Temperatures'
}) => {
  const [cityData, setCityData] = useState<Record<string, CityTemperatureData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const currentTimeRef = useRef<number>(0);
  const [cityColors, setCityColors] = useState<Record<string, string>>({});

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
        
        // Update current time and wrap it within TIME_WINDOW
        currentTimeRef.current = ((Date.now() - startTimeRef.current) / 1000) % TIME_WINDOW;
        
        if (data && data.temperatureData) {
          setCityData(prevData => {
            const newCityData = { ...prevData };
            
            data.temperatureData.forEach((point: TemperatureDataPoint) => {
              if (!newCityData[point.city]) {
                newCityData[point.city] = {
                  city: point.city,
                  timestamps: [],
                  temperatures: []
                };
              }
              
              // Add new data point with wrapped timestamp
              newCityData[point.city].timestamps.push(currentTimeRef.current);
              newCityData[point.city].temperatures.push(point.temperature);
              
              // Keep only last MAX_DATA_POINTS
              if (newCityData[point.city].timestamps.length > MAX_DATA_POINTS) {
                newCityData[point.city].timestamps = newCityData[point.city].timestamps.slice(-MAX_DATA_POINTS);
                newCityData[point.city].temperatures = newCityData[point.city].temperatures.slice(-MAX_DATA_POINTS);
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
    const interval = setInterval(fetchAndProcessData, 100);
    return () => clearInterval(interval);
  }, []);

  // Set fixed window bounds
  const maxTime = TIME_WINDOW;
  const minTime = 0;

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
      pointRadius: 0,
      tension: 0.4,
      fill: false
    }))
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