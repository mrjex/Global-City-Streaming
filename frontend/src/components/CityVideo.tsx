import React from 'react';

const CityVideo: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Video Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-gray-400 text-sm mx-auto">City X</div>
        </div>

        {/* Video Content */}
        <div
          className="p-4 h-96 font-mono text-sm"
          style={{
            backgroundColor: '#1a1b1e',
            overflowY: 'hidden'
          }}
        >
          <video
            className="w-full h-full object-cover rounded-lg"
            autoPlay
            loop
            muted
            playsInline
          >
            <source
              src="https://media1.giphy.com/media/v1.Y2lkPTExMDA4NzRlaTB0OWowbnEyZXlhemk2YWxybnF0a2h5b2gxb3JlMnhvMnp6ajA2dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wuk4K58OTyYec/giphy.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default CityVideo; 