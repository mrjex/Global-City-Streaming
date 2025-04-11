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
  
  // Fetch city coordinates
  const fetchCityCoordinates = async () => {
    try {
      console.log('Fetching city coordinates...');
      const response = await fetch('/api/city-coordinates');
      if (!response.ok) {
        throw new Error('Failed to fetch city coordinates');
      }
      const data = await response.json();
      console.log('Fetched city coordinates:', data);
      
      // Check if coordinates are valid
      const validCoordinates: Record<string, { lat: number; lng: number }> = {};
      
      // Log the raw coordinates for debugging
      console.log('Raw coordinates:', data.coordinates);
      
      for (const [city, coords] of Object.entries(data.coordinates)) {
        // Type assertion to handle the coordinates
        const typedCoords = coords as { lat: number; lng: number };
        
        console.log(`Processing ${city}:`, typedCoords);
        
        // Less strict validation - just check if the coordinates exist
        if (typedCoords && typeof typedCoords.lat === 'number' && typeof typedCoords.lng === 'number') {
          validCoordinates[city] = typedCoords;
          console.log(`Added ${city} with coordinates:`, typedCoords);
        } else {
          console.warn(`Invalid coordinates for ${city}:`, typedCoords);
        }
      }
      
      console.log('Valid coordinates:', validCoordinates);
      setCityCoordinates(validCoordinates);
      
      // Force a re-render when coordinates are updated
      setRenderKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching city coordinates:', error);
    }
  };
  
  useEffect(() => {
    fetchCityCoordinates();
  }, [cities, dynamicCities]);
  
  // Listen for country selection events
  useEffect(() => {
    const handleCountrySelected = (event: CustomEvent) => {
      console.log('Country selected event received in GlobeView:', event.detail);
      // Fetch new city coordinates when country changes
      fetchCityCoordinates();
    };
    
    // Add event listener for country selection
    window.addEventListener('countrySelected', handleCountrySelected as EventListener);
    
    // Also listen for the initial country load event
    const handleInitialCountryLoad = () => {
      console.log('Initial country load event received in GlobeView');
      // Fetch new city coordinates when initial country is loaded
      fetchCityCoordinates();
    };
    
    window.addEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);
    
    return () => {
      window.removeEventListener('countrySelected', handleCountrySelected as EventListener);
      window.removeEventListener('initialCountryLoaded', handleInitialCountryLoad as EventListener);
    };
  }, []);
  
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
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    
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
    console.log('Cities to display:', [...cities, ...dynamicCities]);
    console.log('Available coordinates:', cityCoordinates);
    
    // Create markers for all cities with coordinates
    for (const city of [...cities, ...dynamicCities]) {
      if (cityCoordinates[city]) {
        const { lat, lng } = cityCoordinates[city];
        console.log(`Creating marker for ${city} at coordinates: lat=${lat}, lng=${lng}`);
        const position = latLngToVector3(lat, lng, earthRadius + 0.11);
        const isDynamic = dynamicCities.includes(city);
        const marker = createCityMarker(city, position, isDynamic);
        markerGroup.add(marker);
        markers.push(marker);
      } else {
        console.warn(`No coordinates found for city: ${city}`);
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
      markerGroup.rotation.y += 0.001; // Rotate markers with the Earth
      
      // Pulsate markers
      const time = Date.now() * 0.001;
      markers.forEach(marker => {
        const scale = 1 + Math.sin(time * 2) * 0.2;
        marker.scale.set(scale, scale, scale);
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
  
  return (
    <div className="relative w-[101%] h-full">
      <div ref={containerRef} className="w-full h-full" />
      {hoveredCity && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md">
          {hoveredCity}
        </div>
      )}
    </div>
  );
};

export default GlobeView; 