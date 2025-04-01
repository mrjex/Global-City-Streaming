import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  maxLines?: number;
}

const FlinkTerminals: React.FC<TerminalProps> = ({ maxLines = 15 }) => {
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Use the existing /flink/logs endpoint with Query parameters
        const rawResponse = await fetch('/api/flink-logs/raw');
        const dbResponse = await fetch('/api/flink-logs/db');
        
        const rawText = await rawResponse.text();
        const dbText = await dbResponse.text();
        
        if (rawText && rawText !== '[]') {
          const allRawLogs = rawText.split('\n').filter((line: string) => line.trim());
          setRawLogs(allRawLogs.slice(-maxLines));
        }
        
        if (dbText && dbText !== '[]') {
          const allDbLogs = dbText.split('\n').filter((line: string) => line.trim());
          setDbLogs(allDbLogs.slice(-maxLines));
        }
        
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError('Failed to connect to log server. Please check container status.');
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll for updates every second
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, [maxLines]);

  const runConnectionTest = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/test-connectivity');
      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
        console.log('Connection test results:', results);
      } else {
        setTestResults({ error: `Request failed with status ${response.status}` });
      }
    } catch (error) {
      console.error('Error running connection test:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const Terminal = ({ title, logs }: { title: string; logs: string[] }) => (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl w-1/2">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-400 text-sm mx-auto">{title}</div>
      </div>

      {/* Terminal Content */}
      <div
        className="p-4 h-72 font-mono text-sm"
        style={{
          backgroundColor: '#1a1b1e',
          overflowY: 'auto'
        }}
      >
        {isLoading ? (
          <div className="text-gray-500 italic">Loading logs...</div>
        ) : error ? (
          <div className="text-red-400 italic">{error}</div>
        ) : logs.length > 0 ? (
          logs.map((log, index) => (
            <motion.div
              key={`${index}-${log.slice(0, 20)}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-green-400 mb-1"
            >
              <span className="text-blue-400">$</span> {log}
            </motion.div>
          ))
        ) : (
          <div className="text-gray-500 italic">Waiting for logs...</div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4"
    >
      <h2 className="text-2xl font-bold text-gray-200 mb-4 text-center">
        Flink Processor / Aggregate / Insert Data
      </h2>
      
      <div className="text-center mb-4">
        <button 
          onClick={runConnectionTest}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {isTesting ? 'Testing Connection...' : 'Run Connection Test'}
        </button>
      </div>
      
      {testResults && (
        <div className="mb-4 p-4 bg-gray-800 rounded text-white text-sm">
          <h3 className="font-bold mb-2">Connection Test Results:</h3>
          <pre className="overflow-auto max-h-40">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="flex space-x-4">
        <Terminal title="Raw Data Reception" logs={rawLogs} />
        <Terminal title="Database Insertion" logs={dbLogs} />
      </div>
    </motion.div>
  );
};

export default FlinkTerminals; 