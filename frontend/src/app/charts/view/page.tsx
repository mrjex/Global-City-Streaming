'use client';

import React, { useState, useEffect } from 'react';
import styles from '../Charts.module.css';

export default function ChartsPage() {
  const [charts, setCharts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/charts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch charts: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.charts && Array.isArray(data.charts)) {
        setCharts(data.charts);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        setCharts([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching charts:', err);
      setError(err.message || 'Failed to load charts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>City Temperature Charts</h1>
      
      {loading && (
        <div className={styles.loading}>
          <p>Loading charts...</p>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={fetchCharts} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && charts.length === 0 && (
        <div className={styles.noCharts}>
          <p>No charts available. Click the button below to generate charts.</p>
          <button onClick={fetchCharts} className={styles.generateButton}>
            Generate Charts
          </button>
        </div>
      )}
      
      {charts.length > 0 && (
        <div className={styles.chartsGrid}>
          {charts.map((chartUrl, index) => (
            <div key={index} className={styles.chartCard}>
              <img 
                src={chartUrl} 
                alt={`City temperature chart ${index + 1}`}
                className={styles.chartImage}
              />
            </div>
          ))}
        </div>
      )}
      
      {charts.length > 0 && (
        <div className={styles.refreshButtonContainer}>
          <button onClick={fetchCharts} className={styles.refreshButton}>
            Refresh Charts
          </button>
        </div>
      )}
    </div>
  );
} 