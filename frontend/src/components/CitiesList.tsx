import React from 'react';

interface CitiesListProps {
  staticCities: string[];
  dynamicCities: string[];
}

const CitiesList: React.FC<CitiesListProps> = ({ staticCities, dynamicCities }) => {
  return (
    <div className="w-full h-full">
      {/* Dynamic Cities */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white mb-2 bg-black bg-opacity-30 px-2 py-1 rounded">
          Dynamic Cities ({dynamicCities.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {dynamicCities.map((city, index) => (
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
      <div>
        <h3 className="text-sm font-semibold text-white mb-2 bg-black bg-opacity-30 px-2 py-1 rounded">
          Static Cities ({staticCities.length})
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[calc(100%-8rem)] overflow-y-auto">
          {staticCities.map((city, index) => (
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
  );
};

export default CitiesList; 