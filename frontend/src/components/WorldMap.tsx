'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GeoPath, GeoProjection } from 'd3-geo';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import CityTemperatures from './CityTemperatures';

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

  // Define colors
  const defaultColor = '#a8d5e5';  // Light blue
  const hoverColor = '#62b3d0';    // Darker blue
  const selectedColor = '#2988bc'; // Deep blue
  const strokeColor = '#ffffff';   // White borders
  const oceanColor = '#f8f9fa';    // Light gray background

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 960;
    const height = 500;

    // Clear existing content
    svg.selectAll('*').remove();

    // Add ocean background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', oceanColor);

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
        .style('transition', 'all 0.3s ease')
        .on('mouseover', function(this: SVGPathElement, event: MouseEvent, d: Feature<Geometry, CountryProperties>) {
          const path = d3.select(this);
          if (d.properties.name !== selectedCountry) {
            path.attr('fill', hoverColor)
              .attr('stroke-width', 1)
              .style('filter', 'brightness(1.1)');
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
          
          // Call our API endpoint
          fetch('/api/selected-country', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ country: newSelectedCountry }),
          })
          .then(response => response.json())
          .then(data => {
            console.log('Country selection response:', data);
            if (data.success && data.cities) {
              setCityData(data.cities);
            }
          })
          .catch(error => console.error('Error sending country selection:', error));
          
          onCountrySelect(newSelectedCountry);
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
        }
      });
    });

    return () => {
      // Cleanup
      svg.selectAll('*').remove();
    };
  }, [onCountrySelect, selectedCountry]);

  return (
    <div className="flex flex-col items-center">
      <div className="world-map-container relative">
        <svg
          ref={svgRef}
          width="960"
          height="500"
          viewBox="0 0 960 500"
          style={{
            maxWidth: '100%',
            height: 'auto',
            backgroundColor: oceanColor,
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
      <CityTemperatures cities={cityData} country={selectedCountry} />
    </div>
  );
};

export default WorldMap; 