'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GeoPath, GeoProjection } from 'd3-geo';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import ReactTooltip from 'react-tooltip';
import { motion } from 'framer-motion';
import CityTemperaturesGrid from './CityTemperaturesGrid';

interface WorldMapProps {
  onCountrySelect: (countryName: string) => void;
}

interface CountryProperties {
  name: string;
}

interface City {
  city: string;
  temperature: number | null;
}

const WorldMap: React.FC<WorldMapProps> = ({ onCountrySelect }: WorldMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [cityData, setCityData] = useState<City[]>([]);
  const [countryCode, setCountryCode] = useState<string | null>(null);

  // Initial load for Sweden
  useEffect(() => {
    const defaultCountry = "Sweden";
    
    // First update configuration for Sweden
    fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'dynamicCities',
        config: {
          enabled: true,
          current: [],  // Will be populated with Swedish cities
          previousBatch: []
        }
      })
    })
    .then(response => response.json())
    .then(() => {
      // Then fetch country data
      console.log("SENT REQUEST [WorldMap.tsx] - Initial load");
      return fetch('/api/selected-country', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: defaultCountry }),
      });
    })
    .then(response => response.json())
    .then(data => {
      console.log("RECEIVED REQUEST [WorldMap.tsx] - Initial load", data);
      console.log('Initial country data loaded:', data);
      if (data.success && data.cities) {
        setSelectedCountry(defaultCountry);
        setCityData(data.cities);
        setCountryCode(data.country_code);
        
        // Update configuration with the cities
        return fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: 'dynamicCities',
            config: {
              enabled: true,
              current: data.cities.map((city: any) => city.city),
              previousBatch: []
            }
          })
        })
        .then(() => {
          // Fetch coordinates for the cities if needed
          return fetch('/api/city-coordinates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cities: data.cities.map((city: any) => city.city),
              country: defaultCountry
            })
          })
          .then(response => response.json())
          .then(coordsData => {
            // Dispatch event for initial country load with the data
            const event = new CustomEvent('initialCountryLoaded', {
              detail: { 
                country: defaultCountry,
                data: data,
                coordinates: coordsData.coordinates || {}
              }
            });
            window.dispatchEvent(event);
            return data; // Return data for chaining
          });
        });
      }
    })
    .catch(error => console.error('Error loading initial country data:', error));
  }, []); // Empty dependency array means this runs once on mount

  // Define colors
  const defaultColor = '#1a365d';  // Deep blue
  const hoverColor = '#2b4c7e';    // Lighter blue
  const selectedColor = '#3182ce'; // Bright blue
  const strokeColor = '#2d3748';   // Dark gray borders
  const oceanColor = '#0f172a';    // Dark background

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 960;
    const height = 500;

    // Clear existing content
    svg.selectAll('*').remove();

    // Add gradient definition
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'ocean-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#0f172a');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1e293b');

    // Add ocean background with gradient
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#ocean-gradient)');

    // Create projection with smoother appearance
    const projection: GeoProjection = d3.geoMercator()
      .scale(140)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    // Create path generator
    const pathGenerator: GeoPath = d3.geoPath()
      .projection(projection);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const transform = event.transform;
        mapGroup.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
      });

    // Create a group for the map elements
    const mapGroup = svg.append('g');

    // Apply zoom behavior to SVG
    svg.call(zoom);

    // Load world map data
    d3.json<FeatureCollection<Geometry, CountryProperties>>(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
    ).then((data: FeatureCollection<Geometry, CountryProperties> | undefined) => {
      if (!data) return;

      // Draw the map with smooth transitions
      mapGroup.selectAll<SVGPathElement, Feature<Geometry, CountryProperties>>('path')
        .data(data.features)
        .join('path')
        .attr('d', (d: Feature<Geometry, CountryProperties>) => pathGenerator(d) || '')
        .attr('fill', defaultColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', 0.5)
        .attr('shape-rendering', 'geometricPrecision')
        .style('cursor', 'pointer')
        .style('transition', 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)')
        .style('filter', 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))')
        .on('mouseover', function(this: SVGPathElement, event: MouseEvent, d: Feature<Geometry, CountryProperties>) {
          const path = d3.select(this);
          if (d.properties.name !== selectedCountry) {
            path.attr('fill', hoverColor)
              .attr('stroke-width', 1)
              .style('filter', 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.1)) brightness(1.2)');
          }
        })
        .on('mouseout', function(this: SVGPathElement, event: MouseEvent, d: Feature<Geometry, CountryProperties>) {
          const path = d3.select(this);
          if (d.properties.name !== selectedCountry) {
            path.attr('fill', defaultColor)
              .attr('stroke-width', 0.5)
              .style('filter', null);
          }
        })
        .on('click', function(this: SVGPathElement, event: MouseEvent, d: Feature<Geometry, CountryProperties>) {
          event.stopPropagation();
          
          // Update selected country
          const newSelectedCountry = d.properties.name;
          
          // Reset all countries to default with transition
          mapGroup.selectAll('path')
            .transition()
            .duration(300)
            .attr('fill', defaultColor)
            .attr('stroke-width', 0.5)
            .style('filter', null);
          
          // Highlight selected country with transition
          d3.select(this)
            .transition()
            .duration(300)
            .attr('fill', selectedColor)
            .attr('stroke-width', 1.5)
            .style('filter', 'brightness(1.1)');
          
          setSelectedCountry(newSelectedCountry);
          
          // First get the country data
          console.log("SENT REQUEST [WorldMap.tsx] - Country selection", newSelectedCountry);
          fetch('/api/selected-country', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ country: newSelectedCountry }),
          })
          .then(response => response.json())
          .then(data => {
            console.log("RECEIVED REQUEST [WorldMap.tsx] - Country selection", data);
            console.log('Country selection response:', data);
            if (data.success && data.cities) {
              setCityData(data.cities);
              setCountryCode(data.country_code);
              
              // Then update configuration with the new cities
              return fetch('/api/config', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  path: 'dynamicCities',
                  config: {
                    enabled: true,
                    current: data.cities.map((city: any) => city.city),
                    previousBatch: data.cities.map((city: any) => city.city)
                  }
                })
              })
              .then(() => {
                // Fetch coordinates for the cities
                return fetch('/api/city-coordinates', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    cities: data.cities.map((city: any) => city.city),
                    country: newSelectedCountry
                  })
                })
                .then(response => response.json())
                .then(coordsData => {
                  console.log("RECEIVED COORDINATES [WorldMap.tsx]:", coordsData);
                  
                  // Dispatch custom event for successful country selection with the data and coordinates
                  const event = new CustomEvent('countrySelected', {
                    detail: { 
                      country: newSelectedCountry,
                      data: data,
                      coordinates: coordsData.coordinates || {}
                    }
                  });
                  window.dispatchEvent(event);
                  return data; // Return data for chaining
                });
              });
            }
          })
          .then(() => {
            onCountrySelect(newSelectedCountry);
          })
          .catch(error => console.error('Error sending country selection:', error));
        });

      // Add subtle animation on load
      mapGroup.selectAll('path')
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);

      // Add click handler to reset selection when clicking outside countries
      svg.on('click', (event: MouseEvent) => {
        if (event.target === svgRef.current) {
          mapGroup.selectAll('path')
            .transition()
            .duration(300)
            .attr('fill', defaultColor)
            .attr('stroke-width', 0.5)
            .style('filter', null);
          setSelectedCountry(null);
          setCityData([]);
          setCountryCode(null);
        }
      });
    });

    return () => {
      // Cleanup
      svg.selectAll('*').remove();
    };
  }, [onCountrySelect, selectedCountry]);

  return (
    <div className="flex flex-col items-center space-y-8 p-8 bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Select a Country
      </h1>
      <div className="world-map-container relative w-full max-w-[960px]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-xl"></div>
        <svg
          ref={svgRef}
          width="960"
          height="500"
          viewBox="0 0 960 500"
          className="w-full h-auto rounded-xl backdrop-blur-sm"
          style={{
            backgroundColor: 'transparent',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
      </div>
      <CityTemperaturesGrid cities={cityData} country={selectedCountry} country_code={countryCode} />
    </div>
  );
};

export default WorldMap; 