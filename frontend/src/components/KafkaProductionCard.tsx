import React, { useState, useEffect } from 'react';
import Terminal from './Terminal';

interface KafkaProductionCardProps {
  requestInterval?: number;
  messagesPerSecond?: number;
}

interface CitiesData {
  static: string[];
  dynamic: string[];
}

const KafkaProductionCard: React.FC<KafkaProductionCardProps> = ({
  requestInterval = 1,
  messagesPerSecond = 10
}) => {
  const [displayMode, setDisplayMode] = useState<'map' | 'list'>('map');
  const [cities, setCities] = useState<CitiesData>({ static: [], dynamic: [] });
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Function to fetch cities data
  const fetchCities = async () => {
    setIsLoadingCities(true);
    setError(null);
    try {
      const response = await fetch('/api/cities', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      const data = await response.json();
      setCities(data);
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities data');
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Initial fetch when display mode changes to list
  useEffect(() => {
    if (displayMode === 'list') {
      fetchCities();
    }
  }, [displayMode]);

  // Listen for country selection events
  useEffect(() => {
    const handleCountrySelected = (event: CustomEvent) => {
      console.log('Country selected event received:', event.detail);
      if (displayMode === 'list') {
        fetchCities();
      }
    };

    // Add event listener for country selection
    window.addEventListener('countrySelected', handleCountrySelected as EventListener);
    
    // Also listen for the initial country load event
    const handleInitialCountryLoad = () => {
      console.log('Initial country load event received');
      setInitialLoadComplete(true);
      if (displayMode === 'list') {
        fetchCities();
      }
    };
    
    window.addEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);

    return () => {
      window.removeEventListener('countrySelected', handleCountrySelected as EventListener);
      window.removeEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);
    };
  }, [displayMode]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl mb-8">
      {/* Card Header */}
      <div className="bg-gray-700 px-6 py-3">
        <h2 className="text-xl font-bold text-white">Kafka Production Logs</h2>
      </div>
      
      {/* Terminal Component */}
      <div className="px-4 py-2">
        <Terminal maxLines={10} />
      </div>
      
      {/* Gradient Window with Toggle */}
      <div className="px-4 py-2">
        <div className="relative">
          {/* Toggle Buttons */}
          <div className="absolute top-2 right-2 flex space-x-2 z-10">
            <button 
              onClick={() => setDisplayMode('map')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'map' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Map
            </button>
            <button 
              onClick={() => setDisplayMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              List
            </button>
          </div>
          
          {/* Content Window */}
          <div 
            className="h-48 rounded-lg overflow-hidden"
            style={{
              background: displayMode === 'map' 
                ? 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)'
                : '#1a1b1e',
              backgroundSize: '200% 200%',
              animation: displayMode === 'map' ? 'gradient 15s ease infinite' : 'none'
            }}
          >
            {/* Content based on display mode */}
            {displayMode === 'map' ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-opacity-50">Map View</span>
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto p-4 text-white">
                {isLoadingCities ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Loading cities...</span>
                  </div>
                ) : error ? (
                  <div className="text-red-400">{error}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {/* Dynamic Cities (smaller list) */}
                    <div className="border-r border-gray-700 pr-2">
                      <h3 className="text-sm font-semibold text-blue-400 mb-2">Dynamic Cities</h3>
                      <ul className="text-xs space-y-1">
                        {cities.dynamic.map((city, index) => (
                          <li key={`dynamic-${index}`} className="text-gray-300">
                            {city}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Static Cities (larger list) */}
                    <div className="pl-2">
                      <h3 className="text-sm font-semibold text-green-400 mb-2">Static Cities</h3>
                      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {cities.static.map((city, index) => (
                          <li key={`static-${index}`} className="text-gray-300">
                            {city}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-6 py-3 flex justify-between text-gray-300">
        <div className="italic">Request Interval: {requestInterval} seconds</div>
        <div className="italic">Messages per second: {messagesPerSecond}</div>
      </div>
    </div>
  );
};

export default KafkaProductionCard; 