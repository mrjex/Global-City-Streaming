import * as React from 'react';
const { useState, useEffect, useRef } = React;

interface CityVideoProps {
  selectedCountry: string | null;
}

const CityVideo: React.FC<CityVideoProps> = ({ selectedCountry: initialCountry }) => {
  // Core state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Direct event listening for maximum speed
  useEffect(() => {
    // Simplified unified event handler
    const handleCountryEvent = (event: any) => {
      console.log("[CityVideo.tsx] Country event received", event.type);
      
      // Always update country name immediately
      if (event.detail && event.detail.country) {
        setSelectedCountry(event.detail.country);
      }
      
      // Check for data structure - directly from API response
      if (event.detail && event.detail.data && event.detail.data.success) {
        const data = event.detail.data;
        
        // IMPORTANT: Update description IMMEDIATELY
        if (data.capital_city_description) {
          console.log("[CityVideo.tsx] Updating description");
          const cityMatch = data.capital_city_description.match(/^([^,]+),/);
          const cityName = cityMatch ? cityMatch[1] : '';
          const enhancedDescription = cityName 
            ? data.capital_city_description.replace(cityName, `**${cityName}**`) 
            : data.capital_city_description;
          
          // Set description with no delay
          setDescription(enhancedDescription || '');
        }
        
        // Set video URL with no delay
        if (data.capital_city_video_link) {
          console.log("[CityVideo.tsx] Setting new video:", data.capital_city_video_link);
          setIsLoading(true);
          setVideoUrl(data.capital_city_video_link);
        }
      }
    };
    
    // Add event listeners - using ANY type for maximum compatibility
    window.addEventListener('countrySelected', handleCountryEvent);
    window.addEventListener('initialCountryLoaded', handleCountryEvent);
    
    // Debug
    console.log("[CityVideo.tsx] Event listeners registered");
    
    return () => {
      window.removeEventListener('countrySelected', handleCountryEvent);
      window.removeEventListener('initialCountryLoaded', handleCountryEvent);
    };
  }, []); // Empty dependency array - only run once
  
  // Handle video loading state with improved reliability
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;
    
    // Clear any existing loading timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    // Set a fallback timeout to hide the loading indicator after 8 seconds
    // This ensures loading state won't get stuck indefinitely
    loadingTimerRef.current = setTimeout(() => {
      console.log("[CityVideo.tsx] Fallback timeout: hiding loading indicator");
      setIsLoading(false);
    }, 8000);
    
    const handleVideoEvent = (event: Event) => {
      console.log(`[CityVideo.tsx] Video event triggered: ${event.type} for ${videoUrl}`);
      
      // Only set loading to false if the video has actual data to play
      if (videoRef.current && videoRef.current.readyState >= 3) {
        console.log(`[CityVideo.tsx] Video ready (state: ${videoRef.current.readyState})`);
        setIsLoading(false);
        
        // Clear the fallback timer
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
      }
    };
    
    // Use multiple events for more reliable detection of video loading
    const videoEvents = ['loadeddata', 'canplay', 'playing', 'loadedmetadata'];
    videoEvents.forEach(eventName => {
      videoRef.current?.addEventListener(eventName, handleVideoEvent);
    });
    
    const handleVideoError = (error: Event) => {
      console.error("[CityVideo.tsx] Video error:", videoUrl, error);
      setIsLoading(false);
      
      // Clear the fallback timer
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
    
    videoRef.current.addEventListener('error', handleVideoError);
    
    // Add a periodic check to verify the video is actually playing
    const checkInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.readyState >= 3) {
        console.log("[CityVideo.tsx] Video playing check: confirmed video is playing");
        setIsLoading(false);
        
        // Clear the interval and fallback timer
        clearInterval(checkInterval);
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
      }
    }, 500);
    
    return () => {
      if (videoRef.current) {
        // Remove all event listeners
        videoEvents.forEach(eventName => {
          videoRef.current?.removeEventListener(eventName, handleVideoEvent);
        });
        videoRef.current.removeEventListener('error', handleVideoError);
      }
      
      // Clear all timers
      clearInterval(checkInterval);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [videoUrl]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, []);
  
  // Format description text
  const formatDescription = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Video Header */}
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
          <div className="text-gray-400 text-sm">
            {selectedCountry 
              ? `${selectedCountry === 'England' ? 'United Kingdom' : selectedCountry}'s Most Populated City` 
              : 'Loading country...'}
          </div>
          
          {isLoading && (
            <div className="text-xs text-blue-400 animate-pulse flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading video...
            </div>
          )}
        </div>

        {/* Video Content */}
        <div className="p-4 h-96 font-mono text-sm relative bg-[#1a1b1e] overflow-hidden">
          {/* Video */}
          <div className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
            {videoUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                autoPlay
                loop
                muted
                playsInline
                key={videoUrl} // Force reload on URL change
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-gray-500 italic text-center h-full flex items-center justify-center">
                No video available
              </div>
            )}
          </div>
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg">
              <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Description */}
        <div className="px-4 pb-4 text-gray-300 text-center border-t border-gray-700 mt-4 pt-4">
          {description ? (
            <em 
              dangerouslySetInnerHTML={{ __html: formatDescription(description) }} 
              className="leading-relaxed tracking-wide"
            />
          ) : (
            <div className="animate-pulse h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityVideo; 