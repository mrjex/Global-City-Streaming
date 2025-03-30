import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import path from 'path';

// Function to run Python script
async function runPythonScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', [scriptPath]);
    
    process.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

// Function to read CSV data
async function readCsvData(city: string): Promise<any[]> {
  try {
    const csvPath = '/debug-api/generated-artifacts/csvs/' + city + '.csv';
    const content = await readFile(csvPath, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header
    return lines
      .filter(line => line.trim())
      .map(line => {
        const [id, city, temp, apiCall] = line.split(',');
        return {
          city,
          temperature: parseFloat(temp),
          apiCall: parseInt(apiCall)
        };
      });
  } catch (error) {
    console.error(`Error reading CSV for ${city}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Skip Python script execution during build
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
      return NextResponse.json({
        x: [],
        y: [],
        labels: [],
        values: [],
        cities: []
      });
    }

    // Run database API script to generate fresh CSVs
    const dbApiPath = '/debug-api/apis/databasePostgresApi.py';
    await runPythonScript(dbApiPath);
    
    // Run chart generation scripts
    const pieChartPath = '/debug-api/charts/pieChart.py';
    const bubbleChartPath = '/debug-api/charts/bubbleChart.py';
    await Promise.all([
      runPythonScript(pieChartPath),
      runPythonScript(bubbleChartPath)
    ]);
    
    // Read configuration to get city list
    const configPath = '/configuration.yml';
    const configContent = await readFile(configPath, 'utf8');
    const cities = configContent.match(/realTimeProduction:\n\s+cities:\n((?:\s+-\s+.*\n)*)/)?.[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/\s+-\s+/, ''));
    
    if (!cities) {
      throw new Error('Could not parse cities from configuration');
    }
    
    // Read data from CSVs
    const cityData = await Promise.all(cities.map(city => readCsvData(city)));
    
    // Prepare chart data
    const chartData = {
      x: cityData[0]?.map(d => d.apiCall) || [],
      y: cityData.flatMap(data => data.map(d => d.temperature)),
      labels: cities,
      values: cityData.map(data => data.reduce((sum, d) => sum + d.temperature, 0)),
      cities
    };
    
    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error generating charts:', error);
    return NextResponse.json({
      x: [],
      y: [],
      labels: [],
      values: [],
      cities: []
    }, { status: 500 });
  }
} 