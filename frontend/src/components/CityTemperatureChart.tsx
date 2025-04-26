'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

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

// Constants
const TIME_WINDOW = 4;
const MAX_DATA_POINTS = 4;
const FIXED_TIMESTAMPS = [1, 2, 3, 4];
const POLLING_INTERVAL = 1000;
const VARIANCE_PROBABILITY = 0.2;  // 20% chance of applying variance
const MAX_TEMPERATURE_VARIANCE = 0.5;  // ±0.5°C variance

// Chart colors
const CHART_COLORS = [
  'hsla(354, 85%, 65%, 0.95)',  // Ruby Red
  'hsla(190, 90%, 65%, 0.95)',  // Azure Blue
  'hsla(145, 65%, 60%, 0.95)',  // Emerald Green
  'hsla(280, 75%, 65%, 0.95)',  // Royal Purple
  'hsla(35, 85%, 65%, 0.95)'    // Amber Gold
];

const CityTemperatureChart: React.FC = () => {
  const [cityData, setCityData] = useState<Record<string, CityTemperatureData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [cityColors, setCityColors] = useState<Record<string, string>>({});
  const chartRef = useRef<any>(null);
  const renderTimesRef = useRef<{startTime: number, lastFetchTime: number}>({
    startTime: 0,
    lastFetchTime: 0
  });

  // Function to maybe add variance to temperature
  const applyVariance = (temperature: number): number => {
    if (Math.random() < VARIANCE_PROBABILITY) {
      const variance = (Math.random() * 2 - 1) * MAX_TEMPERATURE_VARIANCE;
      return temperature + variance;
    }
    return temperature;
  };

  // Fetch temperature data for dynamic cities
  const fetchTemperatureData = async () => {
    try {
      const fetchStartTime = performance.now();
      renderTimesRef.current.lastFetchTime = fetchStartTime;
      console.time("ChartView-fetchData");
      console.log(`[PERF] CityTemperatureChart fetch started at ${new Date().toISOString()}`);
      console.log("FETCHING DYNAMIC CITY DATA START [CityTemperatureChart.tsx]");
      const response = await fetch('/api/logs');
      const { logs } = await response.json();

      // Look specifically for dynamic city entries
      const dynamicCityPattern = /\[.+?\] DYNAMIC CITY: Sent data for .+?: ({.+?})/g;
      const cityEntries = logs.match(dynamicCityPattern);
      if (!cityEntries) {
        console.log('No dynamic city entries found in logs');
        console.timeEnd("ChartView-fetchData");
        const fetchEndTime = performance.now();
        console.log(`[PERF] CityTemperatureChart fetch completed (no data) in ${fetchEndTime - fetchStartTime}ms`);
        return;
      }

      console.time("ChartView-processData");
      // Process each dynamic city entry
      const latestCityData: Record<string, { temperature: number; timestamp: number }> = {};
      
      for (const entry of cityEntries) {
        const jsonMatch = entry.match(/({.+?})/);
        if (jsonMatch) {
          try {
            const cityData = JSON.parse(jsonMatch[1]);
            if (cityData.city && typeof cityData.temperatureCelsius === 'number') {
              const city = cityData.city;
              
              // Only update if we don't have data for this city yet
              // This ensures we only keep the most recent entry since logs are in chronological order
              if (!latestCityData[city]) {
                latestCityData[city] = {
                  temperature: applyVariance(cityData.temperatureCelsius),
                  timestamp: Date.now()
                };
              }
            }
          } catch (error) {
            console.error('Error parsing city data:', error);
          }
        }
      }
      console.timeEnd("ChartView-processData");

      console.time("ChartView-updateState");
      // Update chart data with the latest values
      setCityData(prevData => {
        const updatedData: Record<string, CityTemperatureData> = {};
        
        // Process each city's latest data
        Object.entries(latestCityData).forEach(([city, data]) => {
          const existingData = prevData[city];
          
          if (existingData) {
            // Shift existing data and add new value
            updatedData[city] = {
              city,
              timestamps: [...existingData.timestamps.slice(1), TIME_WINDOW],
              temperatures: [...existingData.temperatures.slice(1), data.temperature]
            };
          } else {
            // Initialize new city data
            updatedData[city] = {
              city,
              timestamps: FIXED_TIMESTAMPS.slice(),
              temperatures: Array(MAX_DATA_POINTS).fill(data.temperature)
            };
          }
        });

        console.log("FETCHING DYNAMIC CITY DATA END [CityTemperatureChart.tsx]");
        console.timeEnd("ChartView-updateState");
        const fetchEndTime = performance.now();
        console.log(`[PERF] CityTemperatureChart data processing completed in ${fetchEndTime - fetchStartTime}ms`);
        console.timeEnd("ChartView-fetchData");
        return updatedData;
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching temperature data:', error);
      setIsLoading(false);
      console.timeEnd("ChartView-fetchData");
      const fetchEndTime = performance.now();
      console.log(`[PERF] CityTemperatureChart fetch failed in ${fetchEndTime - renderTimesRef.current.lastFetchTime}ms`);
    }
  };

  // Effect for fetching temperature data
  useEffect(() => {
    renderTimesRef.current.startTime = performance.now();
    console.log(`[PERF] CityTemperatureChart initial mount at ${new Date().toISOString()}`);
    fetchTemperatureData();
    const interval = setInterval(fetchTemperatureData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Monitor chart rendering
  useEffect(() => {
    if (chartRef.current) {
      const renderEndTime = performance.now();
      const lastFetchTime = renderTimesRef.current.lastFetchTime;
      if (lastFetchTime > 0) {
        const renderDuration = renderEndTime - lastFetchTime;
        console.log(`[PERF] CityTemperatureChart render completed in ${renderDuration.toFixed(2)}ms`);
      }
    }
  }, [cityData, isLoading]);

  // Chart rendering logic
  const getColorForCity = (city: string): string => {
    if (!cityColors[city]) {
      const colorIndex = Object.keys(cityColors).length % CHART_COLORS.length;
      setCityColors(prev => ({ ...prev, [city]: CHART_COLORS[colorIndex] }));
      return CHART_COLORS[colorIndex];
    }
    return cityColors[city];
  };

  const createGradient = (ctx: CanvasRenderingContext2D, color: string): CanvasGradient => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    const baseColor = color.replace('0.95)', '');
    gradient.addColorStop(0, baseColor + '0.2)');
    gradient.addColorStop(0.5, baseColor + '0.1)');
    gradient.addColorStop(1, baseColor + '0.05)');
    return gradient;
  };

  // Chart data
  const chartData = {
    labels: FIXED_TIMESTAMPS,
    datasets: Object.values(cityData).map(data => {
      const baseColor = getColorForCity(data.city);
      const ctx = document.createElement('canvas').getContext('2d')!;
      
      return {
        label: data.city,
        data: data.temperatures,
        borderColor: baseColor,
        backgroundColor: createGradient(ctx, baseColor),
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: baseColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true
      };
    })
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        min: 1,
        max: 4,
        title: {
          display: true,
          text: 'Time (seconds)',
          color: '#ddd'
        },
        ticks: {
          color: '#ddd',
          stepSize: 1
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#ddd'
        },
        ticks: {
          color: '#ddd',
          callback: value => value + '°C'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#ddd',
          font: { size: 14 }
        }
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <div className="p-4" style={{ backgroundColor: '#1a1b1e', height: '320px' }}>
          {isLoading ? (
            <div className="text-gray-500 italic text-center">Loading data...</div>
          ) : (
            <Line 
              ref={chartRef}
              data={chartData} 
              options={chartOptions}
              onAfterRender={(chart) => {
                const renderEndTime = performance.now();
                const lastFetchTime = renderTimesRef.current.lastFetchTime;
                if (lastFetchTime > 0) {
                  const renderDuration = renderEndTime - lastFetchTime;
                  console.log(`[PERF] CityTemperatureChart onAfterRender: total time since fetch ${renderDuration.toFixed(2)}ms`);
                }
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CityTemperatureChart; 