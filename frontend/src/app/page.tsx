'use client';

import React, { useState } from 'react';
import type { ReactElement } from 'react';
import WorldMap from '../components/WorldMap';
import DatabaseCounter from '../components/DatabaseCounter';
import CityTemperatureChart from '@/components/CityTemperatureChart';
import CityVideo from '@/components/CityVideo';
import KafkaProductionCard from '@/components/KafkaProductionCard';
import FlinkProcessorCard from '@/components/FlinkProcessorCard';

export default function Home(): ReactElement {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    console.log(`Selected country: ${countryName}`);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <WorldMap onCountrySelect={handleCountrySelect} />
          
          {selectedCountry && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h2 className="text-xl font-semibold">Selected Country: {selectedCountry}</h2>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <CityVideo selectedCountry={selectedCountry} />
          <CityTemperatureChart title="City Temperature Trends" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <KafkaProductionCard />
        <FlinkProcessorCard />
      </div>
      
      <div className="mt-8 flex justify-center">
        <DatabaseCounter />
      </div>
    </main>
  );
} 