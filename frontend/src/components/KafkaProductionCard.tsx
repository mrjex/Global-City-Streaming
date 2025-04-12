import React, { useState, useEffect } from 'react';
import Terminal from './Terminal';

interface CitiesData {
  static: string[];
  dynamic: string[];
}

interface KafkaProductionCardProps {
  showListOnly?: boolean;
}

const KafkaProductionCard: React.FC<KafkaProductionCardProps> = ({ showListOnly = false }) => {
  const [cities, setCities] = useState<CitiesData>({ static: [], dynamic: [] });
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Listen for country selection events
  useEffect(() => {
    const handleCountrySelected = async (event: CustomEvent) => {
      console.log('Country selected event received:', event.detail);
      fetchCities();
    };
    
    window.addEventListener('countrySelected', handleCountrySelected as EventListener);
    
    return () => {
      window.removeEventListener('countrySelected', handleCountrySelected as EventListener);
    };
  }, []);

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
      
      {/* Cities List View */}
      <div className="px-4 py-2">
        <div className="relative">
          <div className="rounded-lg overflow-hidden">
            <div className="w-full p-4 text-white">
              {isLoadingCities ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">Loading cities...</span>
                </div>
              ) : error ? (
                <div className="text-red-400">{error}</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Dynamic Cities */}
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
                  
                  {/* Static Cities */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default KafkaProductionCard; 