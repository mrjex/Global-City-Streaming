import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  maxLines?: number;
}

// Separate component for Raw Data Terminal
const RawDataTerminal: React.FC<{ maxLines: number }> = ({ maxLines }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to clean log messages by removing prefixes
  const cleanLogs = (logs: string[], prefix: string): string[] => {
    return logs.map(log => log.replace(prefix, '').trim());
  };

  // Function to fetch raw logs
  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/flink-logs/raw');
      const text = await response.text();
      
      if (text && text !== '[]') {
        const allLogs = text.split('\n').filter((line: string) => line.trim());
        // Clean logs by removing "Raw data received: " prefix
        const cleanedLogs = cleanLogs(allLogs, "Raw data received:");
        setLogs(cleanedLogs.slice(-maxLines));
      }
      
      setIsLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching raw logs:', error);
      setError('Failed to connect to raw log server. Please check container status.');
      setIsLoading(false);
    }
  };

  // Set up polling for raw logs (every 1 second)
  useEffect(() => {
    // Initial fetch
    fetchLogs();

    // Poll for updates every second
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, [maxLines]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl w-1/2">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-400 text-sm mx-auto">Raw Data Reception</div>
      </div>

      {/* Terminal Content */}
      <div
        className="p-4 h-72 font-mono text-sm terminal-scroll"
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
};

// Separate component for Database Terminal
const DatabaseTerminal: React.FC<{ maxLines: number }> = ({ maxLines }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to clean log messages by removing prefixes
  const cleanLogs = (logs: string[], prefix: string): string[] => {
    return logs.map(log => log.replace(prefix, '').trim());
  };

  // Function to fetch database logs
  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/flink-logs/db');
      const text = await response.text();
      
      if (text && text !== '[]') {
        const allLogs = text.split('\n').filter((line: string) => line.trim());
        // Clean logs by removing "Inserting into DB: " prefix
        const cleanedLogs = cleanLogs(allLogs, "Inserting into DB:");
        setLogs(cleanedLogs.slice(-maxLines));
      }
      
      setIsLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching database logs:', error);
      setError('Failed to connect to database log server. Please check container status.');
      setIsLoading(false);
    }
  };

  // Set up polling for database logs (every 1.5 seconds)
  useEffect(() => {
    // Initial fetch with a delay to stagger the start
    const initialFetch = setTimeout(fetchLogs, 1500);
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchLogs, 2000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [maxLines]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl w-1/2">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-400 text-sm mx-auto">Database Insertion</div>
      </div>

      {/* Terminal Content */}
      <div
        className="p-4 h-72 font-mono text-sm terminal-scroll"
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
};

// Main component that combines both terminals
const FlinkTerminals: React.FC<TerminalProps> = ({ maxLines = 15 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4"
    >
      <style>
        {`
          .terminal-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .terminal-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
          }
          .terminal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
          }
          .terminal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
        `}
      </style>
      <div className="flex space-x-4">
        <RawDataTerminal maxLines={maxLines} />
        <DatabaseTerminal maxLines={maxLines} />
      </div>
    </motion.div>
  );
};

export default FlinkTerminals; 