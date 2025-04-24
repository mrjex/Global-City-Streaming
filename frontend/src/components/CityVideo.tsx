import * as React from 'react';
const { useState, useEffect } = React;

interface CityVideoProps {
  selectedCountry: string | null;
}

const CityVideo: React.FC<CityVideoProps> = ({ selectedCountry: initialCountry }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [key, setKey] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [description, setDescription] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to handle the country selection event
    const handleCountrySelected = (event: any) => {
      console.log('[CityVideo.tsx] Received countrySelected event with data:', event.detail);
      if (event.detail && event.detail.videoUrls) {
        setSelectedCountry(event.detail.country);
        setVideoUrls(event.detail.videoUrls);
        setLoading(false);
      }
    };

    // Function to handle the initial country load event
    const handleInitialCountryLoad = (event: any) => {
      console.log('[CityVideo.tsx] Received initialCountryLoaded event with data:', event.detail);
      if (event.detail && event.detail.videoUrls) {
        setSelectedCountry(event.detail.country);
        setVideoUrls(event.detail.videoUrls);
        setLoading(false);
      }
    };

    // Add event listeners for country selection and initial load
    window.addEventListener('countrySelected', handleCountrySelected);
    window.addEventListener('initialCountryLoaded', handleInitialCountryLoad);

    console.log('[CityVideo.tsx] Event listeners added for countrySelected and initialCountryLoaded');

    // Clean up the event listeners when the component is unmounted
    return () => {
      window.removeEventListener('countrySelected', handleCountrySelected);
      window.removeEventListener('initialCountryLoaded', handleInitialCountryLoad);
    };
  }, []);

  useEffect(() => {
    // Listen for country selection events
    const handleCountrySelected = (event: CustomEvent) => {
      console.log("EVENT RECEIVED [CityVideo.tsx] - Country selected", event.detail);
      if (event.detail && event.detail.data) {
        const data = event.detail.data;
        if (data.success) {
          setVideoUrl(data.capital_city_video_link);
          // Extract city name from the description
          const cityMatch = data.capital_city_description?.match(/^([^,]+),/);
          const cityName = cityMatch ? cityMatch[1] : '';
          // Add bold to city name if found
          const enhancedDescription = cityName 
            ? data.capital_city_description.replace(cityName, `**${cityName}**`) 
            : data.capital_city_description;
          setDescription(enhancedDescription || '');
          setKey(prev => prev + 1);
        }
      }
    };

    // Listen for initial country load events
    const handleInitialCountryLoad = (event: CustomEvent) => {
      console.log("EVENT RECEIVED [CityVideo.tsx] - Initial country loaded", event.detail);
      if (event.detail && event.detail.data) {
        const data = event.detail.data;
        if (data.success) {
          setVideoUrl(data.capital_city_video_link);
          // Extract city name from the description
          const cityMatch = data.capital_city_description?.match(/^([^,]+),/);
          const cityName = cityMatch ? cityMatch[1] : '';
          // Add bold to city name if found
          const enhancedDescription = cityName 
            ? data.capital_city_description.replace(cityName, `**${cityName}**`) 
            : data.capital_city_description;
          setDescription(enhancedDescription || '');
          setKey(prev => prev + 1);
          setIsInitialLoad(false);
        }
      }
    };

    // Add event listeners
    window.addEventListener('countrySelected', handleCountrySelected as EventListener);
    window.addEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);

    // Only fetch directly on initial component mount if there's no data
    if (isInitialLoad && !videoUrl && !selectedCountry) {
      console.log("[CityVideo.tsx] - Waiting for initial country data from WorldMap...");
    }

    // Cleanup event listeners
    return () => {
      window.removeEventListener('countrySelected', handleCountrySelected as EventListener);
      window.removeEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);
    };
  }, [isInitialLoad, videoUrl, selectedCountry]);

  // Function to convert markdown-style bold to HTML
  const formatDescription = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Video Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center">
          <div className="text-gray-400 text-sm mx-auto">
            {selectedCountry ? `${selectedCountry === 'England' ? 'United Kingdom' : selectedCountry}'s Most Populated City` : 'Sweden\'s Most Populated City'}
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
          <em 
            dangerouslySetInnerHTML={{ 
              __html: formatDescription(description) || 'Loading description...' 
            }} 
            className="leading-relaxed tracking-wide"
          />
        </div>
      </div>
    </div>
  );
};

export default CityVideo; 