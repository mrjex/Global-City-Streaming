import React from 'react';
import FlinkTerminals from './FlinkTerminals';

interface FlinkProcessorCardProps {
  batchSize?: number;
  windowSize?: number;
}

const FlinkProcessorCard: React.FC<FlinkProcessorCardProps> = ({
  batchSize = 100,
  windowSize = 5
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl mb-8">
      {/* Card Header */}
      <div className="bg-gray-700 px-6 py-3">
        <h2 className="text-xl font-bold text-white">Flink Processor Logs</h2>
      </div>
      
      {/* FlinkTerminals Component */}
      <div className="px-4 py-2">
        <FlinkTerminals maxLines={10} />
      </div>
      
      {/* Empty Window */}
      <div className="px-4 py-2">
        <div className="h-48 rounded-lg bg-gray-900 flex items-center justify-center">
          <span className="text-gray-500">Empty Window</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-6 py-3 flex justify-between text-gray-300">
        <div className="italic">{batchSize} ms batch</div>
        <div className="italic">{windowSize} second window</div>
      </div>
    </div>
  );
};

export default FlinkProcessorCard; 