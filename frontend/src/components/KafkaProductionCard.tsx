import React, { useState, useEffect } from 'react';
import Terminal from './Terminal';
import CityTemperatureChart from './CityTemperatureChart';

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
      <div className="px-4 pb-1">
        <Terminal maxLines={10} />
      </div>
      
      {/* Temperature Chart Component */}
      <div className="px-4 pt-1 pb-2">
        <CityTemperatureChart />
      </div>
    </div>
  );
};

export default KafkaProductionCard; 