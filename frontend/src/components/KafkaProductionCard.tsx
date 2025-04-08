import React, { useState } from 'react';
import Terminal from './Terminal';

interface KafkaProductionCardProps {
  requestInterval?: number;
  messagesPerSecond?: number;
}

const KafkaProductionCard: React.FC<KafkaProductionCardProps> = ({
  requestInterval = 1,
  messagesPerSecond = 10
}) => {
  const [displayMode, setDisplayMode] = useState<'map' | 'list'>('map');

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl mb-8">
      {/* Card Header */}
      <div className="bg-gray-700 px-6 py-3">
        <h2 className="text-xl font-bold text-white">Kafka Production Logs</h2>
      </div>
      
      {/* Terminal Component */}
      <div className="px-4 py-2">
        <Terminal maxLines={10} />
      </div>
      
      {/* Gradient Window with Toggle */}
      <div className="px-4 py-2">
        <div className="relative">
          {/* Toggle Buttons */}
          <div className="absolute top-2 right-2 flex space-x-2 z-10">
            <button 
              onClick={() => setDisplayMode('map')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'map' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Map
            </button>
            <button 
              onClick={() => setDisplayMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              List
            </button>
          </div>
          
          {/* Gradient Window */}
          <div 
            className="h-48 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
              backgroundSize: '200% 200%',
              animation: 'gradient 15s ease infinite'
            }}
          >
            {/* Content based on display mode */}
            {displayMode === 'map' ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-opacity-50">Map View</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-opacity-50">List View</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-6 py-3 flex justify-between text-gray-300">
        <div className="italic">Request Interval: {requestInterval} seconds</div>
        <div className="italic">Messages per second: {messagesPerSecond}</div>
      </div>
    </div>
  );
};

export default KafkaProductionCard; 