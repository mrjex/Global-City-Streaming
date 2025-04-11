import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  title?: string;
}

const Terminal: React.FC<TerminalProps> = ({ 
  title = 'Data Production'
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        
        if (data && data.logs) {
          const allLogs = data.logs.split('\n').filter(line => line.trim());
          setLogs(allLogs);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    const terminalContent = document.querySelector('.terminal-scroll');
    if (terminalContent) {
      terminalContent.scrollTop = terminalContent.scrollHeight;
    }
  }, [logs]);

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
          <div className="text-gray-400 text-sm mx-auto">
            {title}
          </div>
        </div>

        {/* Terminal Content */}
        <div
          className="p-4 h-72 font-mono text-sm terminal-scroll"
          style={{
            backgroundColor: '#1a1b1e',
            overflowY: 'auto',
          }}
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
    </motion.div>
  );
};

export default Terminal; 