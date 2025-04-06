'use client';

import React, { useState } from 'react';
import type { ReactElement } from 'react';
import WorldMap from '../components/WorldMap';
import DatabaseCounter from '../components/DatabaseCounter';
import Terminal from '@/components/Terminal';
import FlinkTerminals from '@/components/FlinkTerminals';
// import Charts from '@/components/Charts';  // Commented out bubble and pie charts
import CityTemperatureChart from '@/components/CityTemperatureChart';
import EquatorChartQueryPanel from '@/components/EquatorChartQueryPanel';

export default function Home(): ReactElement {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    console.log(`Selected country: ${countryName}`);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Global City Streaming</h1>
      
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <DatabaseCounter />
          </div>
          
          <Terminal maxLines={10} />
          
          <CityTemperatureChart title="City Temperature Trends" />
        </div>
      </div>

      <div className="mt-8">
        <EquatorChartQueryPanel />
      </div>

      <FlinkTerminals maxLines={10} />

      {/* Commented out bubble and pie charts */}
      {/* <Charts /> */}
    </main>
  );
} 