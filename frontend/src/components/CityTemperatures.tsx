'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface City {
  city: string;
  temperature: number | null;
}

interface CityTemperaturesProps {
  cities: City[];
  country: string | null;
}

const CityTemperatures: React.FC<CityTemperaturesProps> = ({ cities, country }) => {
  if (!country || cities.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Cities in {country}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {cities.map((city, index) => (
            <motion.div
              key={city.city}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {city.city}
              </h3>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-yellow-500 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-2xl font-bold text-gray-700">
                  {city.temperature !== null ? (
                    <>
                      {city.temperature}°C
                    </>
                  ) : (
                    <span className="text-gray-500 text-base">No data</span>
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CityTemperatures; 