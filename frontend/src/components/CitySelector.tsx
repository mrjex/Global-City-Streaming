import React, { useState } from 'react';

interface CitySelectorProps {
  onCitiesChange?: (cities: string[]) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ onCitiesChange }) => {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const availableCities = [
    'London', 'Stockholm', 'Toronto', 'Moscow', 'Madrid',
    'Reykjavik', 'Helsinki', 'Rome', 'Venice', 'Lisbon',
    'Paris', 'Amsterdam', 'Chernobyl', 'Nairobi', 'Dubai',
    'Bali', 'Tokyo', 'Bangkok', 'Seoul', 'Buenos Aires',
    'Mexico City'
  ];

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => {
      const newSelection = prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city];
      
      console.log('Selected cities:', newSelection);
      onCitiesChange?.(newSelection);
      return newSelection;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">City Selection</h2>
      <div className="mb-4">
        <span className="text-gray-600">
          Selected Cities: {selectedCities.length}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {availableCities.map(city => (
          <button
            key={city}
            onClick={() => handleCityToggle(city)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${selectedCities.includes(city)
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CitySelector; 