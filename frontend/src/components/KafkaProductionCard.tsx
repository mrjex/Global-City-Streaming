import React, { useState, useEffect } from 'react';
import Terminal from './Terminal';
import GlobeView from './GlobeView';

interface CitiesData {
  static: string[];
  dynamic: string[];
}

const KafkaProductionCard: React.FC = () => {
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

  // Initial fetch when component mounts
  useEffect(() => {
    fetchCities();
  }, []);

  // Fetch when display mode changes to list
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
            className="h-64 rounded-lg overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
              backgroundSize: '200% 200%',
              animation: 'gradient 15s ease infinite'
            }}
          >
            {/* Content based on display mode */}
            {displayMode === 'map' ? (
              <div className="w-full h-full">
                <GlobeView 
                  key={`${cities.static.join(',')}-${cities.dynamic.join(',')}`}
                  cities={cities.static} 
                  dynamicCities={cities.dynamic} 
                />
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
                    <div className="border-r border-white border-opacity-20 pr-2">
                      <h3 className="text-sm font-semibold text-white mb-2 bg-black bg-opacity-30 px-2 py-1 rounded">
                        Dynamic Cities ({cities.dynamic.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {cities.dynamic.map((city, index) => (
                          <div 
                            key={`dynamic-${index}`} 
                            className="bg-black bg-opacity-40 px-2 py-1 rounded-md text-xs text-white backdrop-blur-sm hover:bg-opacity-60 transition-all duration-200"
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Static Cities (larger list) */}
                    <div className="pl-2">
                      <h3 className="text-sm font-semibold text-white mb-2 bg-black bg-opacity-30 px-2 py-1 rounded">
                        Static Cities ({cities.static.length})
                      </h3>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {cities.static.map((city, index) => (
                          <div 
                            key={`static-${index}`} 
                            className="bg-black bg-opacity-40 px-2 py-1 rounded-md text-xs text-white backdrop-blur-sm hover:bg-opacity-60 transition-all duration-200"
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KafkaProductionCard; 