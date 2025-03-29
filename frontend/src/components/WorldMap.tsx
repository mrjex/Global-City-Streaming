'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GeoPath, GeoProjection } from 'd3-geo';
import { Feature, FeatureCollection, Geometry } from 'geojson';

interface WorldMapProps {
  onCountrySelect: (countryName: string) => void;
}

interface CountryProperties {
  name: string;
}

const WorldMap: React.FC<WorldMapProps> = ({ onCountrySelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 960;
    const height = 500;

    // Create projection
    const projection: GeoProjection = d3.geoMercator()
      .scale(130)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    // Create path generator
    const pathGenerator: GeoPath<any, any> = d3.geoPath().projection(projection);

    // Load world map data
    d3.json<FeatureCollection<Geometry, CountryProperties>>(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
    ).then((data) => {
      if (!data) return;

      // Draw the map
      svg.selectAll('path')
        .data(data.features)
        .join('path')
        .attr('d', (d) => pathGenerator(d) || '')
        .attr('fill', '#69b3a2')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this)
            .attr('fill', '#2E8B57');
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('fill', '#69b3a2');
        })
        .on('click', function(_event, d: Feature<Geometry, CountryProperties>) {
          onCountrySelect(d.properties.name);
        });
    });

    return () => {
      // Cleanup
      svg.selectAll('*').remove();
    };
  }, [onCountrySelect]);

  return (
    <div className="world-map-container">
      <svg
        ref={svgRef}
        width="960"
        height="500"
        viewBox="0 0 960 500"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default WorldMap; 