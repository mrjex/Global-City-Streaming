'use client';

import React from 'react';
import EquatorChartQueryPanel from '@/components/EquatorChartQueryPanel';
import DatabaseCounter from '@/components/DatabaseCounter';
import Footer from '@/components/Footer';

export default function AdditionalChartsPage() {
  // Images from the public directory
  const temperatureRankings = [
    '/images/additional-charts/temperature-rankings/4-coldest-now.png',
    '/images/additional-charts/temperature-rankings/all-cities-aqua-theme.png',
    '/images/additional-charts/temperature-rankings/all-cities-purple-theme.png',
    '/images/additional-charts/temperature-rankings/two-cities-random-colors.png',
    '/images/additional-charts/temperature-rankings/all-cities-red-theme.png',
    '/images/additional-charts/temperature-rankings/all-cities-orange-theme.png'
  ];

  const cityComparisons = [
    '/images/additional-charts/city-comparisons/all-cities-aqua-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-random-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-brown-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-blue-theme-no-outline.png',
    '/images/additional-charts/city-comparisons/lisbon-yellow-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-original.png'
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-8">
      {/* Page Header */}
      <div className="relative group mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden p-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
            Production Charts Gallery
          </h1>
          <p className="text-gray-300 text-lg italic">
            Explore the collection of real-time data visualizations, showcasing streaming analytics from the Kafka-Flink pipeline through various chart styles and themes.
          </p>
        </div>
      </div>

      {/* Equator Chart Section */}
      <div className="relative group mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
          <EquatorChartQueryPanel />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Temperature Rankings Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              Temperature Rankings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {temperatureRankings.map((src, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                  <img
                    src={src}
                    alt={`Temperature Rankings Image ${index + 1}`}
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* City Comparisons Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl transform transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              City Comparisons
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cityComparisons.map((src, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
                  <img
                    src={src}
                    alt={`City Comparisons Image ${index + 1}`}
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Database Counter Section */}
      <div className="mt-12 mb-12">
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