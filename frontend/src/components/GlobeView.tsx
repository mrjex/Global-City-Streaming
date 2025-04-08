import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface City {
  name: string;
  lat: number;
  lng: number;
}

interface GlobeViewProps {
  cities: {
    static: string[];
    dynamic: string[];
  };
}

const GlobeView: React.FC<GlobeViewProps> = ({ cities }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; text: string; x: number; y: number }>({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });
  
  // Sample city coordinates (in a real app, you would get these from an API or database)
  const cityCoordinates: Record<string, City> = {
    'London': { name: 'London', lat: 51.5074, lng: -0.1278 },
    'Stockholm': { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
    'Toronto': { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    'Moscow': { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
    'Madrid': { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    'Reykjavik': { name: 'Reykjavik', lat: 64.1265, lng: -21.8174 },
    'Helsinki': { name: 'Helsinki', lat: 60.1699, lng: 24.9384 },
    'Rome': { name: 'Rome', lat: 41.9028, lng: 12.4964 },
    'Venice': { name: 'Venice', lat: 45.4408, lng: 12.3155 },
    'Lisbon': { name: 'Lisbon', lat: 38.7223, lng: -9.1393 },
    'Paris': { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    'Amsterdam': { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    'Chernobyl': { name: 'Chernobyl', lat: 51.2763, lng: 30.2219 },
    'Nairobi': { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
    'Dubai': { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    'Bali': { name: 'Bali', lat: -8.3405, lng: 115.0920 },
    'Tokyo': { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    'Bangkok': { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
    'Seoul': { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
    'Buenos Aires': { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
    'Mexico City': { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
    'Honolulu': { name: 'Honolulu', lat: 21.3069, lng: -157.8583 },
    'Papeete': { name: 'Papeete', lat: -17.5390, lng: -149.5671 },
    'Juneau': { name: 'Juneau', lat: 58.3019, lng: -134.4197 },
    'Sacramento': { name: 'Sacramento', lat: 38.5816, lng: -121.4944 },
    'Tijuana': { name: 'Tijuana', lat: 32.5149, lng: -117.0382 },
    'Gothenburg': { name: 'Gothenburg', lat: 57.7089, lng: 11.9746 },
    'Malmö': { name: 'Malmö', lat: 55.6050, lng: 13.0038 },
    'Uppsala': { name: 'Uppsala', lat: 59.8586, lng: 17.6389 },
    'Västerås': { name: 'Västerås', lat: 59.6099, lng: 16.5448 },
    'Örebro': { name: 'Örebro', lat: 59.2741, lng: 15.2066 },
    'Linköping': { name: 'Linköping', lat: 58.4108, lng: 15.6214 }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1.5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Earth setup
    const earthGeometry = new THREE.SphereGeometry(3, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load('/images/earth-texture.jpg'),
      bumpMap: new THREE.TextureLoader().load('/images/earth-bump.jpg'),
      bumpScale: 0.05,
      specularMap: new THREE.TextureLoader().load('/images/earth-specular.jpg'),
      specular: new THREE.Color('grey'),
      shininess: 10
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(3.1, 128, 128);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.3);
    sunLight.position.set(1, 1, 1);
    scene.add(sunLight);

    // City markers
    const markers: THREE.Mesh[] = [];
    const markerData: { mesh: THREE.Mesh; city: City }[] = [];

    // Function to create a city marker
    const createCityMarker = (city: City) => {
      const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      // Convert lat/lng to 3D position
      const phi = (90 - city.lat) * (Math.PI / 180);
      const theta = (city.lng + 180) * (Math.PI / 180);
      
      marker.position.x = -(3 * Math.sin(phi) * Math.cos(theta));
      marker.position.y = 3 * Math.cos(phi);
      marker.position.z = 3 * Math.sin(phi) * Math.sin(theta);
      
      earth.add(marker);
      markers.push(marker);
      markerData.push({ mesh: marker, city });
      
      return marker;
    };

    // Create markers for all cities
    const allCities = [...cities.static, ...cities.dynamic];
    allCities.forEach(cityName => {
      if (cityCoordinates[cityName]) {
        createCityMarker(cityCoordinates[cityName]);
      }
    });

    // Pulsating animation for markers
    const animateMarkers = () => {
      const time = Date.now() * 0.001;
      markers.forEach((marker, i) => {
        const scale = 1 + 0.3 * Math.sin(time * 2 + i);
        marker.scale.set(scale, scale, scale);
      });
    };

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Handle mouse move for tooltips
    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(markers);
      
      if (intersects.length > 0) {
        const intersectedMarker = intersects[0].object;
        const markerInfo = markerData.find(data => data.mesh === intersectedMarker);
        
        if (markerInfo) {
          setTooltip({
            visible: true,
            text: `${markerInfo.city.name}\n${markerInfo.city.lat.toFixed(2)}°, ${markerInfo.city.lng.toFixed(2)}°`,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
      } else {
        setTooltip({ ...tooltip, visible: false });
      }
    };

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    containerRef.current.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      animateMarkers();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cities]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {tooltip.visible && (
        <div 
          className="absolute bg-black bg-opacity-70 text-white p-2 rounded text-xs pointer-events-none z-10"
          style={{ 
            left: `${tooltip.x + 10}px`, 
            top: `${tooltip.y + 10}px`,
            whiteSpace: 'pre-line'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default GlobeView; 