import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInterval } from '@/hooks/useInterval';

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ChartData {
  x: number[];
  y: number[];
  labels: string[];
  values: number[];
  cities: string[];
}

const Charts: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/charts');
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Fetch data every 5 seconds
  useInterval(fetchChartData, 5000);

  // Initial fetch
  useEffect(() => {
    fetchChartData();
  }, []);

  if (!chartData) return <div>Loading charts...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Temperature Distribution</h3>
        <Plot
          data={[{
            type: 'pie',
            labels: chartData.labels,
            values: chartData.values,
            textinfo: 'label+percent',
            insidetextorientation: 'radial'
          }]}
          layout={{
            height: 400,
            margin: { t: 0, b: 0, l: 0, r: 0 },
            showlegend: true
          }}
          config={{ responsive: true }}
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Temperature Trends</h3>
        <Plot
          data={chartData.cities.map((city, index) => ({
            type: 'scatter',
            mode: 'markers',
            name: city,
            x: chartData.x,
            y: chartData.y.slice(index * chartData.x.length, (index + 1) * chartData.x.length),
            marker: { size: 11 }
          }))}
          layout={{
            height: 400,
            margin: { t: 0, b: 50, l: 50, r: 0 },
            xaxis: { title: 'API Call Number' },
            yaxis: { title: 'Temperature' },
            showlegend: true
          }}
          config={{ responsive: true }}
        />
      </div>
    </div>
  );
};

export default Charts; 