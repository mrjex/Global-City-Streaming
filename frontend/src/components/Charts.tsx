import React, { useEffect, useState } from 'react';
import styles from '../app/charts/Charts.module.css';

interface ChartData {
  charts: string[];
}

const Charts: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/charts');
      if (!response.ok) {
        throw new Error(`Failed to fetch charts: ${response.statusText}`);
      }
      const data = await response.json();
      setChartData(data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
      setError(error.message || 'Failed to load charts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchChartData, 5000);
    // Initial fetch
    fetchChartData();
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className={styles.loading}>Loading charts...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!chartData || !chartData.charts || chartData.charts.length === 0) {
    return <div className={styles.noCharts}>No charts available</div>;
  }

  return (
    <div className={styles.chartsGrid}>
      {chartData.charts.map((chartUrl, index) => (
        <div key={index} className={styles.chartCard}>
          <img 
            src={chartUrl} 
            alt={`Temperature chart ${index + 1}`}
            className={styles.chartImage}
          />
        </div>
      ))}
    </div>
  );
};

export default Charts; 