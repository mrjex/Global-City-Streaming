'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EquatorChart from './EquatorChart';

interface EquatorChartQueryPanelProps {
  title?: string;
}

const EquatorChartQueryPanel: React.FC<EquatorChartQueryPanelProps> = ({
  title = 'Equator Chart Query Section'
}) => {
  const [queryAttribute, setQueryAttribute] = useState<string>('');
  const [queryRequirement, setQueryRequirement] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [figureData, setFigureData] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // Chart display options
  const [displayLinearTrend, setDisplayLinearTrend] = useState(false);
  const [displayLogarithmicTrend, setDisplayLogarithmicTrend] = useState(true);
  const [displayActualTrend, setDisplayActualTrend] = useState(false);

  // Requirement options based on attribute selection
  const requirementOptions = {
    continent: ['Europe', 'Asia', 'America', 'Atlantic', 'Africa'],
    timeZoneOffset: [
      'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+6', 
      'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12',
      'UTC-1', 'UTC-2', 'UTC-3', 'UTC-4', 'UTC-5', 'UTC-6',
      'UTC-7', 'UTC-8', 'UTC-9', 'UTC-10', 'UTC-11', 'UTC-12'
    ]
  };

  // Function to fetch chart data
  const fetchChartData = async () => {
    // Only proceed if configuration is loaded
    if (!configLoaded) {
      console.log('Configuration not loaded yet, skipping chart data fetch');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Fetching chart data with:', { queryAttribute, queryRequirement });
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'visualizations',
          config: {
            queryConfig: {
              queryAttribute,
              queryRequirement
            },
            charts: {
              equatorChart: {
                displayLinearTrend,
                displayLogarithmicTrend,
                displayActualTrend,
                pngOutput: false
              }
            }
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.figure) {
          setFigureData(data.figure);
        }
      } else {
        console.error('Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current config and chart data on initial load
  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentConfig();
      // Only fetch chart data after config is loaded
      if (configLoaded) {
        await fetchChartData();
      }
    };
    initializeData();
  }, [configLoaded]);

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.visualizations && config.visualizations.queryConfig) {
          setQueryAttribute(config.visualizations.queryConfig.queryAttribute || '');
          setQueryRequirement(config.visualizations.queryConfig.queryRequirement || '');
        }
        if (config.visualizations?.charts?.equatorChart) {
          const chartConfig = config.visualizations.charts.equatorChart;
          setDisplayLinearTrend(chartConfig.displayLinearTrend || false);
          setDisplayLogarithmicTrend(chartConfig.displayLogarithmicTrend || true);
          setDisplayActualTrend(chartConfig.displayActualTrend || false);
        }
        // Mark configuration as loaded
        setConfigLoaded(true);
        console.log('Configuration loaded:', { 
          queryAttribute: config.visualizations?.queryConfig?.queryAttribute,
          queryRequirement: config.visualizations?.queryConfig?.queryRequirement
        });
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  const handleSubmit = async () => {
    await fetchChartData();
  };

  // Toggle switch component
  const ToggleSwitch = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <button
        type="button"
        className={`${checked ? 'bg-blue-600' : 'bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
    </div>
  );

  return (
    <>
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
            {/* Query Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            {/* Chart Display Options */}
            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="text-gray-300 mb-4">Chart Display Options</h3>
              <div className="grid grid-cols-1 gap-4">
                <ToggleSwitch
                  label="Display Linear Trend"
                  checked={displayLinearTrend}
                  onChange={setDisplayLinearTrend}
                />
                <ToggleSwitch
                  label="Display Logarithmic Trend"
                  checked={displayLogarithmicTrend}
                  onChange={setDisplayLogarithmicTrend}
                />
                <ToggleSwitch
                  label="Display Actual Trend"
                  checked={displayActualTrend}
                  onChange={setDisplayActualTrend}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Configuration & Generate Chart'}
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
      
      {/* Render the chart below the query panel */}
      <EquatorChart figureData={figureData} />
    </>
  );
};

export default EquatorChartQueryPanel; 