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
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlobeVisible, setIsGlobeVisible] = useState<boolean>(true);
  const GLOBE_REMOUNT_DELAY = 1200;

  // Function to fetch cities data
  const fetchCities = async () => {
    console.log('🔄 Fetching cities...');
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
      console.log('📍 Received cities data:', {
        staticCount: data.static?.length || 0,
        dynamicCount: data.dynamic?.length || 0,
        static: data.static,
        dynamic: data.dynamic
      });
      setCities(data);
      
      // Force a complete remount of the GlobeView component
      console.log('🔄 Remounting GlobeView...');
      setIsGlobeVisible(false);
      setTimeout(() => {
        console.log('✅ GlobeView remounted');
        setIsGlobeVisible(true);
      }, GLOBE_REMOUNT_DELAY);
    } catch (err) {
      console.error('❌ Error fetching cities:', err);
      setError('Failed to load cities data');
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Listen for initial country load and country changes
  useEffect(() => {
    console.log('🎯 Setting up event listeners for country changes');
    
    const handleInitialCountryLoad = async (event: CustomEvent) => {
      const { country, data } = event.detail;
      console.log('🚀 Initial country loaded:', {
        country,
        hasData: !!data,
        timestamp: new Date().toISOString()
      });
      setSelectedCountry(country);
      await fetchCities();
    };

    const handleCountryChange = async (event: CustomEvent) => {
      const { country, data } = event.detail;
      console.log('🔄 Country changed:', {
        from: selectedCountry,
        to: country,
        hasData: !!data,
        timestamp: new Date().toISOString()
      });
      setSelectedCountry(country);
      await fetchCities();
    };

    // Add event listeners
    window.addEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);
    window.addEventListener('countrySelected', handleCountryChange as EventListener);

    return () => {
      console.log('♻️ Cleaning up event listeners');
      window.removeEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);
      window.removeEventListener('countrySelected', handleCountryChange as EventListener);
    };
  }, []);

  const handleCountrySelect = async (countryName: string) => {
    console.log('🎯 Country selection initiated:', {
      country: countryName,
      timestamp: new Date().toISOString()
    });
    setSelectedCountry(countryName);
    
    try {
      // Update the selected country
      console.log('📡 Sending country update request...');
      const response = await fetch('/api/selected-country', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: countryName }),
      });
      
      const data = await response.json();
      console.log('📥 Country update response:', {
        success: data.success,
        hasData: !!data,
        timestamp: new Date().toISOString()
      });

      if (data.success) {
        // Dispatch custom event for GlobeView
        console.log('📢 Dispatching countrySelected event');
        const event = new CustomEvent('countrySelected', { 
          detail: { country: countryName, data } 
        });
        window.dispatchEvent(event);
        
        // Then fetch new cities
        await fetchCities();
      }
    } catch (error) {
      console.error('❌ Error updating country:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-8">
      {/* Top Section: World Map and City Video */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <WorldMap onCountrySelect={handleCountrySelect} />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <CityVideo selectedCountry={selectedCountry} />
          </div>
        </div>
      </div>

      {/* Globe View Section */}
      <div className="mt-12">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="px-8 py-4 border-b border-gray-700/50">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Real-time Cities Monitored
              </h2>
            </div>
            <div className="h-[600px]">
              {isGlobeVisible && !isLoadingCities && (
                <GlobeView 
                  cities={cities.static} 
                  dynamicCities={cities.dynamic}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kafka and Flink Cards Section */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <KafkaProductionCard showListOnly={true} />
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <FlinkProcessorCard />
          </div>
        </div>
      </div>
      
      {/* Database Counter Section */}
      <div className="mt-12">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden p-8">
            <div className="flex justify-center">
              <DatabaseCounter />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
} 