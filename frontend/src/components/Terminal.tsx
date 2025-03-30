import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  title?: string;
  maxLines?: number;
}

const Terminal: React.FC<TerminalProps> = ({ 
  title = 'Kafka Producer Logs',
  maxLines = 15
}) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        const data = await response.text();
        
        // Only update logs if we got actual data
        if (data && data !== '[]') {
          const allLogs = data.split('\n').filter(line => line.trim());
          setLogs(allLogs.slice(-maxLines));
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll for updates every second
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, [maxLines]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
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
          className="p-4 h-96 font-mono text-sm overflow-y-auto"
          style={{
            backgroundColor: '#1a1b1e',
          }}
        >
          {logs.length > 0 ? (
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
    </motion.div>
  );
};

export default Terminal; 