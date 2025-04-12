import React from 'react';

interface CitiesData {
  static: string[];
  dynamic: string[];
}

interface CitiesListViewProps {
  cities: CitiesData;
  isLoadingCities: boolean;
  error: string | null;
}

const CitiesListView: React.FC<CitiesListViewProps> = ({ cities, isLoadingCities, error }) => {
  return (
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
  );
};

export default CitiesListView; 