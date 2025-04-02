'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import Plotly dynamically with no SSR to prevent "self is not defined" errors
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div className="text-gray-500 italic text-center">Loading chart...</div>
});

interface CityTemperatureData {
  city: string;
  timestamps: Date[];
  temperatures: number[];
}

interface CityTemperatureChartProps {
  title?: string;
}

const CityTemperatureChart: React.FC<CityTemperatureChartProps> = ({
  title = 'City Temperatures'
}) => {
  const [cityData, setCityData] = useState<Record<string, CityTemperatureData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        const data = await response.text();
        
        if (data && data !== '[]') {
          const allLogs = data.split('\n').filter(line => line.trim());
          
          // Process logs to extract city temperature data
          const newCityData = { ...cityData };
          
          allLogs.forEach(log => {
            // Match the specific log format from python-producer.py:
            // [timestamp] Sent data: {"city": "CityName", "temperature": "23.45"}
            const jsonMatch = log.match(/Sent data: (\{.*\})/);
            
            if (jsonMatch) {
              try {
                const jsonData = JSON.parse(jsonMatch[1]);
                
                if (jsonData.city && jsonData.temperature) {
                  const city = jsonData.city;
                  const temperature = parseFloat(jsonData.temperature);
                  const timestamp = new Date();
                  
                  if (!isNaN(temperature)) {
                    if (!newCityData[city]) {
                      newCityData[city] = {
                        city,
                        timestamps: [],
                        temperatures: []
                      };
                    }
                    
                    // Keep only the last 20 data points for each city
                    if (newCityData[city].timestamps.length >= 20) {
                      newCityData[city].timestamps.shift();
                      newCityData[city].temperatures.shift();
                    }
                    
                    newCityData[city].timestamps.push(timestamp);
                    newCityData[city].temperatures.push(temperature);
                  }
                }
              } catch (error) {
                console.error('Error parsing JSON from logs:', error);
              }
            }
          });
          
          setCityData(newCityData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAndProcessLogs();

    // Poll for updates every second
    const interval = setInterval(fetchAndProcessLogs, 1000);

    return () => clearInterval(interval);
  }, []);

  // Properly cast the result of Object.values to CityTemperatureData[]
  const plotData = (Object.values(cityData) as CityTemperatureData[]).map(city => ({
    x: city.timestamps,
    y: city.temperatures,
    type: 'scatter',
    mode: 'lines+markers',
    name: city.city,
  }));

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-gray-800 px-4 py-2">
          <div className="text-gray-400 text-sm text-center">{title}</div>
        </div>
        <div className="p-4" style={{ backgroundColor: '#1a1b1e' }}>
          {isLoading ? (
            <div className="text-gray-500 italic text-center">Loading data...</div>
          ) : plotData.length > 0 ? (
            <Plot
              data={plotData}
              layout={{
                title: '',
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#ddd' },
                margin: { l: 50, r: 50, b: 50, t: 20 },
                xaxis: {
                  title: 'Time',
                  color: '#ddd',
                  gridcolor: '#444'
                },
                yaxis: {
                  title: 'Temperature (°C)',
                  color: '#ddd',
                  gridcolor: '#444'
                },
                legend: {
                  font: { color: '#ddd' }
                },
                autosize: true,
                height: 350
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="text-gray-500 italic text-center">No temperature data available...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityTemperatureChart; 