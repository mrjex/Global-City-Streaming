'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface City {
  city: string;
  temperature: number | null;
}

interface CityTemperaturesGridProps {
  cities: City[];
  country: string | null;
  country_code?: string;
}

const CityTemperaturesGrid: React.FC<CityTemperaturesGridProps> = ({ cities, country, country_code }) => {
  if (!country || cities.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full max-w-[960px] p-8 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800"
    >
      <div className="flex items-center gap-6 mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Cities in {country}
        </h2>
        {country_code && (
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            src={`https://flagcdn.com/w320/${country_code.toLowerCase()}.png`}
            alt={`Flag of ${country}`}
            className="h-10 rounded-lg shadow-lg ring-1 ring-gray-700"
          />
        )}
      </div>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        <AnimatePresence mode="wait">
          {cities.map((city, index) => (
            <motion.div
              key={city.city}
              variants={itemVariants}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <div className="relative p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  {city.city}
                </h3>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-yellow-400 mr-3 group-hover:animate-spin-slow"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {city.temperature !== null ? (
                    <motion.span 
                      className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {city.temperature}°C
                    </motion.span>
                  ) : (
                    <span className="text-gray-400 text-lg">No data</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Add this at the end of your CSS or in your Tailwind config
const style = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
`;

export default CityTemperaturesGrid; 