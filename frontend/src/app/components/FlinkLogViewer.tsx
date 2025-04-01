import React, { useState, useEffect } from 'react';
import styles from './LogViewer.module.css';

interface FlinkLogViewerProps {
  logType: 'raw' | 'db';
}

const FlinkLogViewer: React.FC<FlinkLogViewerProps> = ({ logType }) => {
  const [logs, setLogs] = useState<string>('Waiting for logs...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/flink-logs/${logType}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching logs: ${response.statusText}`);
      }
      
      const logText = await response.text();
      setLogs(logText || 'No logs available.');
      setError(null);
    } catch (err: any) {
      console.error('Error fetching Flink logs:', err);
      setError(`Failed to fetch logs: ${err.message}`);
      setLogs('Error loading logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Poll for logs every 3 seconds
    const intervalId = setInterval(fetchLogs, 3000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [logType]);

  return (
    <div className={styles.logContainer}>
      <div className={styles.logHeader}>
        <h3>{logType === 'raw' ? 'Flink Raw Logs' : 'Flink Database Logs'}</h3>
        <button 
          onClick={fetchLogs} 
          disabled={isLoading}
          className={styles.refreshButton}
        >
          Refresh
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <pre className={styles.logContent}>
        {logs}
      </pre>
    </div>
  );
};

export default FlinkLogViewer; 