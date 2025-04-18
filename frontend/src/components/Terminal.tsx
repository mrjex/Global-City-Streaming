import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  maxLines?: number;
  title?: string;
}

const Terminal: React.FC<TerminalProps> = ({ 
  maxLines = 1000,
  title = 'Data Production'
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seenLogs] = useState<Set<string>>(new Set());
  const [logWindow, setLogWindow] = useState<string[]>([]);

  // Function to select a varied subset of logs
  const selectLogsForDisplay = useCallback((allLogs: string[]) => {
    const dynamicLogs = allLogs.filter(log => log.includes('DYNAMIC CITY:'));
    const staticLogs = allLogs.filter(log => !log.includes('DYNAMIC CITY:'));
    
    // Calculate how many logs to show (about 1/3 of maxLines)
    const displayCount = Math.min(Math.floor(maxLines / 3), allLogs.length);
    
    // Try to maintain a 40/60 ratio between dynamic and static logs
    const dynamicCount = Math.floor(displayCount * 0.4);
    const staticCount = displayCount - dynamicCount;
    
    // Randomly select logs from each category
    const selectedDynamic = dynamicLogs
      .sort(() => Math.random() - 0.5)
      .slice(0, dynamicCount);
    
    const selectedStatic = staticLogs
      .sort(() => Math.random() - 0.5)
      .slice(0, staticCount);
    
    // Combine and sort by timestamp
    return [...selectedDynamic, ...selectedStatic]
      .sort((a, b) => {
        const timeA = a.match(/\[(.*?)\]/)?.[1] || '';
        const timeB = b.match(/\[(.*?)\]/)?.[1] || '';
        return timeA.localeCompare(timeB);
      });
  }, [maxLines]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        
        const data = await response.json();
        
        if (data && data.logs) {
          // Split logs into lines and filter out empty lines
          const newLogs = data.logs.split('\n')
            .filter(line => line.trim())
            .filter(line => !seenLogs.has(line));

          if (newLogs.length > 0) {
            // Add new logs to seen set
            newLogs.forEach(log => seenLogs.add(log));
            
            // Update logs state with new unique logs
            setLogs(prevLogs => {
              const combinedLogs = [...prevLogs, ...newLogs];
              // Keep more logs in memory than we display
              return combinedLogs.slice(-maxLines * 2);
            });
          }
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError('Failed to fetch logs. Please check container status.');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, [maxLines, seenLogs]);

  // Update displayed logs whenever the log collection changes
  useEffect(() => {
    if (logs.length > 0) {
      const selectedLogs = selectLogsForDisplay(logs);
      setLogWindow(selectedLogs);
    }
  }, [logs, selectLogsForDisplay]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    const terminalContent = document.querySelector('.terminal-scroll');
    if (terminalContent) {
      terminalContent.scrollTop = terminalContent.scrollHeight;
    }
  }, [logWindow]);

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
          {isLoading && logWindow.length === 0 ? (
            <div className="text-gray-500 italic">Loading logs...</div>
          ) : error ? (
            <div className="text-red-400 italic">{error}</div>
          ) : logWindow.length > 0 ? (
            logWindow.map((log, index) => (
              <motion.div
                key={`${index}-${log.slice(0, 20)}-${Date.now()}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-1 ${log.includes('DYNAMIC CITY:') ? 'text-blue-400' : 'text-green-400'}`}
              >
                <span className="text-purple-400">$</span> {log}
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