import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  maxLines?: number;
}

const FlinkTerminals: React.FC<TerminalProps> = ({ maxLines = 15 }) => {
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Fetch raw data logs
        const rawResponse = await fetch('/api/logs/flink-raw');
        const rawData = await rawResponse.text();
        
        // Fetch DB insertion logs
        const dbResponse = await fetch('/api/logs/flink-db');
        const dbData = await dbResponse.text();
        
        if (rawData && rawData !== '[]') {
          const allRawLogs = rawData.split('\n').filter((line: string) => line.trim());
          setRawLogs(allRawLogs.slice(-maxLines));
        }
        
        if (dbData && dbData !== '[]') {
          const allDbLogs = dbData.split('\n').filter((line: string) => line.trim());
          setDbLogs(allDbLogs.slice(-maxLines));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll for updates every second
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, [maxLines]);

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
        ) : logs.length > 0 ? (
          logs.map((log, index) => (
            <motion.div
              key={`${index}-${log}`}
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
      <div className="flex space-x-4">
        <Terminal title="Raw Data Reception" logs={rawLogs} />
        <Terminal title="Database Insertion" logs={dbLogs} />
      </div>
    </motion.div>
  );
};

export default FlinkTerminals; 