'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Import Plotly with no SSR
const Plot = dynamic(
  () => import('react-plotly.js'),
  { ssr: false, loading: () => <div className="text-gray-500 italic text-center">Loading chart...</div> }
);

interface EquatorChartProps {
  figureData?: string | null;
  title?: string;
}

const EquatorChart: React.FC<EquatorChartProps> = ({
  figureData = null,
  title = 'Equator Chart Visualization'
}) => {
  // Parse the figure data from JSON string
  const plotlyFigure = figureData ? JSON.parse(figureData) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Chart Header */}
        <div className="bg-gray-800 px-4 py-2">
          <div className="text-gray-400 text-lg font-semibold mx-auto text-center">{title}</div>
        </div>

        {/* Chart Content */}
        <div className="p-6" style={{ backgroundColor: '#1a1b1e', minHeight: '460px' }}>
          {!plotlyFigure ? (
            <div className="text-gray-500 italic text-center">No chart data available. Please submit a query.</div>
          ) : (
            <Plot
              data={plotlyFigure.data}
              layout={{
                ...plotlyFigure.layout,
                paper_bgcolor: '#1a1b1e',
                plot_bgcolor: '#1a1b1e',
                font: { color: '#ddd' },
                margin: { t: 40, r: 40, l: 70, b: 40 },
                showlegend: true,
                legend: {
                  font: { color: '#ddd' },
                  bgcolor: 'transparent'
                },
                xaxis: {
                  ...plotlyFigure.layout.xaxis,
                  gridcolor: '#444',
                  color: '#ddd'
                },
                yaxis: {
                  ...plotlyFigure.layout.yaxis,
                  gridcolor: '#444',
                  color: '#ddd'
                },
                coloraxis: {
                  colorbar: {
                    thickness: 15,
                    len: 0.75,
                    tickfont: { color: '#ddd' }
                  }
                }
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: [
                  'lasso2d',
                  'select2d',
                  'zoom2d',
                  'pan2d',
                  'zoomIn2d',
                  'zoomOut2d',
                  'autoScale2d',
                  'resetScale2d'
                ]
              }}
              className="w-full h-[400px]"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EquatorChart; 