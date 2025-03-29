'use client';

import { useState } from 'react';
import WorldMap from '../components/WorldMap';

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    // Here you can add logic to fetch weather data for the selected country
    console.log(`Selected country: ${countryName}`);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Global City Streaming</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <WorldMap onCountrySelect={handleCountrySelect} />
        
        {selectedCountry && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold">Selected Country: {selectedCountry}</h2>
            {/* Add more UI elements for displaying weather data */}
          </div>
        )}
      </div>
    </main>
  );
} 