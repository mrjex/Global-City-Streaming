import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface City {
  name: string;
  lat: number;
  lng: number;
}

interface GlobeViewProps {
  cities: string[];
  dynamicCities: string[];
}

const GlobeView: React.FC<GlobeViewProps> = ({ cities, dynamicCities }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [cityCoordinates, setCityCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});
  const [renderKey, setRenderKey] = useState<number>(0);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // Listen for country selection events
  useEffect(() => {
    const handleCountrySelect = (event: any) => {
      console.log('[GlobeView.tsx] Received countrySelected event with data:', event.detail);
      
      // Update selected country
      if (event.detail.country) {
        setSelectedCountry(event.detail.country);
      }
      
      // Debug event structure
      console.log('[GlobeView.tsx] Event coordinates structure:', {
        hasCoordinates: !!event.detail.coordinates,
        type: event.detail.coordinates ? typeof event.detail.coordinates : 'not present',
        keys: event.detail.coordinates ? Object.keys(event.detail.coordinates) : []
      });
      
      if (event.detail.coordinates) {
        console.log('[GlobeView.tsx] Setting coordinates from event:', event.detail.coordinates);
        setCityCoordinates(event.detail.coordinates);
        // Force a re-render
        setForceUpdate(prev => prev + 1);
      } else if (event.detail.data && event.detail.data.coordinates) {
        // Try alternative location for coordinates
        console.log('[GlobeView.tsx] Setting coordinates from event.detail.data:', event.detail.data.coordinates);
        setCityCoordinates(event.detail.data.coordinates);
        setForceUpdate(prev => prev + 1);
      } else {
        console.error('[GlobeView.tsx] No coordinates found in event:', event.detail);
        // If no coordinates in the event, fetch them using the batch endpoint
        fetchCityCoordinatesBatch();
      }
    };

    // Listen for initial country load events
    const handleInitialCountryLoad = (event: any) => {
      console.log('[GlobeView.tsx] Received initialCountryLoaded event with data:', event.detail);
      
      // Update selected country
      if (event.detail.country) {
        setSelectedCountry(event.detail.country);
      }
      
      // Debug event structure 
      console.log('[GlobeView.tsx] Event coordinates structure:', {
        hasCoordinates: !!event.detail.coordinates,
        type: event.detail.coordinates ? typeof event.detail.coordinates : 'not present',
        keys: event.detail.coordinates ? Object.keys(event.detail.coordinates) : []
      });
      
      if (event.detail.coordinates) {
        console.log('[GlobeView.tsx] Setting coordinates from event:', event.detail.coordinates);
        setCityCoordinates(event.detail.coordinates);
        // Force a re-render
        setForceUpdate(prev => prev + 1);
      } else if (event.detail.data && event.detail.data.coordinates) {
        // Try alternative location for coordinates
        console.log('[GlobeView.tsx] Setting coordinates from event.detail.data:', event.detail.data.coordinates);
        setCityCoordinates(event.detail.data.coordinates);
        setForceUpdate(prev => prev + 1);
      } else {
        console.error('[GlobeView.tsx] No coordinates found in event:', event.detail);
        // If no coordinates in the event, fetch them using the batch endpoint
        fetchCityCoordinatesBatch();
      }
    };

    window.addEventListener('countrySelected', handleCountrySelect);
    window.addEventListener('initialCountryLoaded', handleInitialCountryLoad);

    // Function to fetch city coordinates in batch
    const fetchCityCoordinatesBatch = async () => {
      console.log('[GlobeView.tsx] Fetching city coordinates using batch endpoint');
      
      // Get all cities that need coordinates
      const allCities = [...cities, ...dynamicCities];
      if (allCities.length === 0) {
        console.log('[GlobeView.tsx] No cities to fetch coordinates for');
        return;
      }
      
      try {
        // Create request body with cities and optional country
        const requestBody: any = { cities: allCities };
        if (selectedCountry) {
          requestBody.country = selectedCountry;
          console.log(`[GlobeView.tsx] Including country (${selectedCountry}) in coordinates request`);
        }
        
        const response = await fetch('/api/city-coordinates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch coordinates: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[GlobeView.tsx] Received coordinates from batch endpoint:', data);
        
        if (data.coordinates) {
          setCityCoordinates(data.coordinates);
          setForceUpdate(prev => prev + 1);
        } else {
          console.error('[GlobeView.tsx] No coordinates in response:', data);
        }
      } catch (error) {
        console.error('[GlobeView.tsx] Error fetching city coordinates:', error);
      }
    };

    // This will be called when component loads to ensure we have coordinates
    const fetchCityCoordinates = () => {
      if (Object.keys(cityCoordinates).length === 0) {
        console.log('[GlobeView.tsx] No coordinates available, fetching using batch endpoint');
        fetchCityCoordinatesBatch();
      } else {
        console.log('[GlobeView.tsx] Using existing coordinates:', cityCoordinates);
      }
    };

    fetchCityCoordinates();

    return () => {
      window.removeEventListener('countrySelected', handleCountrySelect);
      window.removeEventListener('initialCountryLoaded', handleInitialCountryLoad);
    };
  }, [cities, dynamicCities, selectedCountry]);

  // Update markers when cityCoordinates change
  useEffect(() => {
    if (Object.keys(cityCoordinates).length > 0) {
      console.log('[GlobeView.tsx] City coordinates updated from events:', cityCoordinates);
      // No need to call updateMarkers() as the main useEffect will handle marker creation
      setRenderKey(prev => prev + 1); // Force re-render to update markers
    }
  }, [cityCoordinates, forceUpdate]);
  
  // Convert lat/lng to 3D coordinates
  const latLngToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  };
  
  // Create a city marker
  const createCityMarker = (city: string, position: THREE.Vector3, isDynamic: boolean = false) => {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: isDynamic ? 0xffff00 : 0xff0000 // Yellow for dynamic cities, red for static
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.copy(position);
    marker.userData = { city };
    
    return marker;
  };
  
  // Setup scene, camera, renderer
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 1.5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = false;
    containerRef.current.appendChild(renderer.domElement);
    
    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false;
    controls.minDistance = 5;
    controls.maxDistance = 5;
    
    // Earth setup
    const earthRadius = 3;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 128, 128);
    const textureLoader = new THREE.TextureLoader();
    
    // Debug texture loading
    console.log('Loading earth textures...');
    
    // Update texture paths to point to the images directory
    const earthTexture = textureLoader.load('/images/earth-texture.jpg', 
      () => console.log('Earth texture loaded successfully'),
      undefined,
      (error) => console.error('Error loading earth texture:', error)
    );
    
    const bumpMap = textureLoader.load('/images/earth-bump.jpg',
      () => console.log('Bump map loaded successfully'),
      undefined,
      (error) => console.error('Error loading bump map:', error)
    );
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      shininess: 10
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Atmosphere setup
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius + 0.1, 128, 128);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create city markers
    const markers: THREE.Mesh[] = [];
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    
    // Debug city coordinates
    console.log('Creating markers for cities:', { static: cities, dynamic: dynamicCities });
    console.log('Available coordinates:', cityCoordinates);
    
    // First add static cities
    for (const city of cities) {
      if (cityCoordinates[city]) {
        const { lat, lng } = cityCoordinates[city];
        const position = latLngToVector3(lat, lng, earthRadius + 0.11);
        const marker = createCityMarker(city, position, false);
        markerGroup.add(marker);
        markers.push(marker);
      }
    }
    
    // Then add dynamic cities with different height and color
    for (const city of dynamicCities) {
      if (cityCoordinates[city]) {
        const { lat, lng } = cityCoordinates[city];
        const position = latLngToVector3(lat, lng, earthRadius + 0.13); // Higher position for better visibility
        const marker = createCityMarker(city, position, true);
        
        // Make dynamic markers slightly larger
        marker.scale.set(1.2, 1.2, 1.2);
        
        // Add to scene
        markerGroup.add(marker);
        markers.push(marker);
      }
    }
    
    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle mouse move for hover detection
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(markers);
      
      if (intersects.length > 0) {
        const city = intersects[0].object.userData.city;
        setHoveredCity(city);
      } else {
        setHoveredCity(null);
      }
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      earth.rotation.y += 0.001;
      atmosphere.rotation.y += 0.001;
      markerGroup.rotation.y += 0.001;
      
      // Pulsate markers with different effects for static and dynamic
      const time = Date.now() * 0.001;
      markers.forEach(marker => {
        if (marker.userData.city && dynamicCities.includes(marker.userData.city)) {
          // More pronounced pulsing for dynamic cities
          const scale = 1.2 + Math.sin(time * 3) * 0.3;
          marker.scale.set(scale, scale, scale);
        } else {
          // Subtle pulsing for static cities
          const scale = 1 + Math.sin(time * 2) * 0.2;
          marker.scale.set(scale, scale, scale);
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [cities, dynamicCities, cityCoordinates, renderKey]);
  
  // Add new function to render the cities list
  const renderCitiesList = () => {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4 h-full">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2 bg-black bg-opacity-30 px-2 py-1 rounded">
            Dynamic Cities ({dynamicCities.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {dynamicCities.map((city, index) => (
              <div 
                key={`dynamic-${index}`} 
                className={`
                  bg-black bg-opacity-40 px-2 py-1 rounded-md text-xs text-white 
                  backdrop-blur-sm hover:bg-opacity-60 transition-all duration-200
                  ${hoveredCity === city ? 'ring-2 ring-yellow-400' : ''}
                `}
              >
                {city}
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-[calc(100%-8rem)]">
          <h3 className="text-sm font-semibold text-white mb-2 bg-black bg-opacity-30 px-2 py-1 rounded">
            Static Cities ({cities.length})
          </h3>
          <div className="flex flex-wrap gap-2 h-[calc(100%-3rem)] overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-2
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-black/20
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-gray-500/50
                        hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/50
                        [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
                        transition-all duration-200">
            {cities.map((city, index) => (
              <div 
                key={`static-${index}`} 
                className={`
                  bg-black bg-opacity-40 px-2 py-1 rounded-md text-xs text-white 
                  backdrop-blur-sm hover:bg-opacity-60 transition-all duration-200
                  ${hoveredCity === city ? 'ring-2 ring-red-400' : ''}
                `}
              >
                {city}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4 w-full h-full">
      {/* Cities List */}
      <div className="w-1/4 min-w-[250px]">
        {renderCitiesList()}
      </div>
      
      {/* Globe */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
        {hoveredCity && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md">
            {hoveredCity}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeView; 