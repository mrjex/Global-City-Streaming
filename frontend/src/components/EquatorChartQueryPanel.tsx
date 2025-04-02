'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EquatorChartQueryPanelProps {
  title?: string;
}

const EquatorChartQueryPanel: React.FC<EquatorChartQueryPanelProps> = ({
  title = 'Equator Chart Query Section'
}) => {
  const [queryAttribute, setQueryAttribute] = useState<string>('continent');
  const [queryRequirement, setQueryRequirement] = useState<string>('Europe');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Requirement options based on attribute selection
  const requirementOptions = {
    continent: ['Europe', 'Asia'],
    timeZoneOffset: ['UTC+0', 'UTC+1', 'UTC+2', 'UTC+3']
  };

  // Fetch current config on initial load
  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  // When attribute changes, select the first requirement option by default
  useEffect(() => {
    if (queryAttribute === 'continent') {
      setQueryRequirement('Europe');
    } else {
      setQueryRequirement('UTC+0');
    }
  }, [queryAttribute]);

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.debugApi && config.debugApi.queryConfig) {
          setQueryAttribute(config.debugApi.queryConfig.queryAttribute || 'continent');
          setQueryRequirement(config.debugApi.queryConfig.queryRequirement || 'Europe');
        }
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'debugApi.queryConfig',
          config: {
            queryAttribute,
            queryRequirement
          }
        }),
      });

      if (response.ok) {
        setMessage('Configuration updated successfully!');
      } else {
        setMessage('Failed to update configuration.');
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      setMessage('Error updating configuration. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Panel Header */}
        <div className="bg-gray-800 px-4 py-2">
          <div className="text-gray-400 text-lg font-semibold mx-auto text-center">{title}</div>
        </div>

        {/* Panel Content */}
        <div className="p-6" style={{ backgroundColor: '#1a1b1e' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Query Attribute Selection */}
            <div>
              <label className="block text-gray-300 mb-2">Query Attribute</label>
              <select
                value={queryAttribute}
                onChange={(e) => setQueryAttribute(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="continent">Continent</option>
                <option value="timeZoneOffset">Time Zone Offset</option>
              </select>
            </div>

            {/* Query Requirement Selection */}
            <div>
              <label className="block text-gray-300 mb-2">Query Requirement</label>
              <select
                value={queryRequirement}
                onChange={(e) => setQueryRequirement(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {queryAttribute === 'continent' && requirementOptions.continent.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
                {queryAttribute === 'timeZoneOffset' && requirementOptions.timeZoneOffset.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Configuration'}
            </button>
            
            {message && (
              <p className={`mt-3 ${message.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EquatorChartQueryPanel; 