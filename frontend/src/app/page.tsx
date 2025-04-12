'use client';

import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import WorldMap from '../components/WorldMap';
import DatabaseCounter from '../components/DatabaseCounter';
import CityTemperatureChart from '@/components/CityTemperatureChart';
import CityVideo from '@/components/CityVideo';
import KafkaProductionCard from '@/components/KafkaProductionCard';
import FlinkProcessorCard from '@/components/FlinkProcessorCard';
import Footer from '@/components/Footer';
import GlobeView from '@/components/GlobeView';

interface CitiesData {
  static: string[];
  dynamic: string[];
}

export default function Home(): ReactElement {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [cities, setCities] = useState<CitiesData>({ static: [], dynamic: [] });

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    console.log(`Selected country: ${countryName}`);
  };

  // Fetch cities data
  useEffect(() => {
    const fetchCities = async () => {
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
      }
    };

    fetchCities();
  }, []);

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

        <div>
          <CityVideo selectedCountry={selectedCountry} />
        </div>
      </div>

      <div className="mt-8 w-full">
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
          <div className="bg-gray-800 px-6 py-3">
            <h2 className="text-xl font-bold text-white">Real-time Cities Monitored</h2>
          </div>
          <div className="h-[600px]">
            <GlobeView cities={cities.static} dynamicCities={cities.dynamic} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <KafkaProductionCard />
        </div>
        <div>
          <FlinkProcessorCard />
        </div>
      </div>
      
      <div className="mt-8 space-y-8">
        <CityTemperatureChart title="City Temperature Trends" />
        <div className="flex justify-center">
          <DatabaseCounter />
        </div>
      </div>
      <Footer />
    </main>
  );
} 