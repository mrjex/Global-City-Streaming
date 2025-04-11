import React, { useState, useEffect, useRef } from 'react';
import FlinkTerminals from './FlinkTerminals';

const FlinkProcessorCard: React.FC = () => {
  const [throughput, setThroughput] = useState(0);
  const [config, setConfig] = useState<{
    batchIntervalMs: number;
    sampleDuration: number;
  }>({ batchIntervalMs: 200, sampleDuration: 15 }); // Default values
  const previousLogsRef = useRef<string[]>([]);
  const lastUpdateTimeRef = useRef(Date.now());
  const throughputHistoryRef = useRef<number[]>([]);
  const MAX_HISTORY = 5; // Keep last 5 measurements

  // Load configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        setConfig({
          batchIntervalMs: config.services.flinkProcessor.batchIntervalMs,
          sampleDuration: config.services.flinkProcessor.sampleDuration
        });
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    };
    
    fetchConfig();
  }, []);

  // Function to fetch logs and count them
  const fetchAndCountLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      
      if (data && data.logs) {
        const allLogs = data.logs.split('\n').filter(line => line.trim());
        
        // Find new logs that weren't in the previous check
        const newLogs = allLogs.filter(log => !previousLogsRef.current.includes(log));
        
        // Calculate time elapsed since last update
        const currentTime = Date.now();
        const timeElapsed = (currentTime - lastUpdateTimeRef.current) / 1000; // in seconds
        
        // Calculate throughput (logs per second)
        if (timeElapsed >= 0.5) { // Update at least every 0.5 seconds
          const calculatedThroughput = Math.round(newLogs.length / timeElapsed);
          
          // Add to history and calculate moving average
          if (calculatedThroughput > 0) {
            throughputHistoryRef.current.push(calculatedThroughput);
            if (throughputHistoryRef.current.length > MAX_HISTORY) {
              throughputHistoryRef.current.shift(); // Remove oldest
            }
            
            // Calculate average throughput from history
            const avgThroughput = Math.round(
              throughputHistoryRef.current.reduce((sum, val) => sum + val, 0) / 
              throughputHistoryRef.current.length
            );
            
            setThroughput(avgThroughput);
          }
          
          // Update refs for next calculation
          previousLogsRef.current = allLogs;
          lastUpdateTimeRef.current = currentTime;
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Set up polling for logs
  useEffect(() => {
    // Initial fetch
    fetchAndCountLogs();
    
    // Poll for updates every 500ms
    const interval = setInterval(fetchAndCountLogs, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl mb-8">
      {/* Card Header */}
      <div className="bg-gray-700 px-6 py-3">
        <h2 className="text-xl font-bold text-white">Flink Processor Logs</h2>
      </div>
      
      {/* FlinkTerminals Component */}
      <div className="px-4 py-2">
        <FlinkTerminals maxLines={10} />
      </div>
      
      {/* Empty Window */}
      <div className="px-4 py-2">
        <div className="h-64 rounded-lg bg-gray-900 p-4 text-gray-300">
          {/* Metrics Section */}
          <div className="flex justify-between mb-4">
            <div className="text-sm font-bold text-transparent bg-clip-text" style={{ 
              backgroundImage: 'linear-gradient(135deg, #00ff9d, #00b8d4, #00ff9d, #39e75f)',
              WebkitBackgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradient 5s ease infinite'
            }}>
              Throughput: {throughput} records/sec
            </div>
            <div className="text-sm font-bold text-transparent bg-clip-text" style={{ 
              backgroundImage: 'linear-gradient(135deg, #00b8d4, #7c4dff, #00b8d4, #536dfe)',
              WebkitBackgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradient 5s ease infinite'
            }}>
              {config.batchIntervalMs}ms Batch
            </div>
          </div>
          
          <h4 className="text-sm font-medium mb-2 text-white">Aggregation Formula:</h4>
          <p className="text-sm font-mono">
            For each {config.sampleDuration}-second window:<br />
            - Group data by city<br />
            - Calculate sum of metrics for each city<br />
            - Compute the average of the summed metrics<br />
            - Apply sliding window logic: new data enters, old data exits<br />
            - Output aggregated average results to PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlinkProcessorCard; 