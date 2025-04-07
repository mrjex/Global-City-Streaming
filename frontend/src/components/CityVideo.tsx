import React, { useState, useEffect } from 'react';

interface CityVideoProps {
  selectedCountry: string | null;
}

const CityVideo: React.FC<CityVideoProps> = ({ selectedCountry }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [key, setKey] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    const fetchVideoUrl = async () => {
      // For initial load, use "Sweden" if no country is selected
      const countryToFetch = isInitialLoad ? "Sweden" : selectedCountry;
      if (!countryToFetch) return;
      
      try {
        const response = await fetch('/api/selected-country', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ country: countryToFetch }),
        });
        const data = await response.json();
        if (data.success) {
          setVideoUrl(data.capital_city_video_link);
          setDescription(data.capital_city_description || '');
          setKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error fetching video URL:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchVideoUrl();
  }, [selectedCountry, isInitialLoad]);

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
          <div className="text-gray-400 text-sm mx-auto">
            {selectedCountry ? `${selectedCountry}'s Most Popular City` : 'Sweden\'s Most Popular City'}
          </div>
        </div>

        {/* Video Content */}
        <div
          className="p-4 h-96 font-mono text-sm"
          style={{
            backgroundColor: '#1a1b1e',
            overflowY: 'hidden'
          }}
        >
          {videoUrl ? (
            <video
              key={key}
              className="w-full h-full object-cover rounded-lg"
              autoPlay
              loop
              muted
              playsInline
            >
              <source
                src={videoUrl}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-gray-500 italic text-center h-full flex items-center justify-center">
              Loading video...
            </div>
          )}
        </div>
        <div className="px-4 pb-4 text-gray-300 text-center border-t border-gray-700 mt-4 pt-4">
          {description || 'Loading description...'}
        </div>
      </div>
    </div>
  );
};

export default CityVideo; 