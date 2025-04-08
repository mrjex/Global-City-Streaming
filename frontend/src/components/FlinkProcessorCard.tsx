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
        <div className="h-64 rounded-lg bg-gray-900 p-4 text-gray-300">
          <h4 className="text-sm font-medium mb-2 text-white">Aggregation Formula:</h4>
          <p className="text-sm font-mono">
            For each 15-second window:<br />
            - Group data by city<br />
            - Calculate sum of metrics for each city<br />
            - Compute the average of the summed metrics<br />
            - Apply sliding window logic: new data enters, old data exits<br />
            - Output aggregated average results to PostgreSQL
          </p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-6 py-4 flex justify-between text-gray-300">
        <div className="italic">{batchSize} ms batch</div>
        <div className="italic">{windowSize} second window</div>
      </div>
    </div>
  );
};

export default FlinkProcessorCard; 