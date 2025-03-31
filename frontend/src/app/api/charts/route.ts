import { NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { readFile } from 'fs/promises';
import path from 'path';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Function to run Python script
async function runPythonScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process: ChildProcess = spawn('python3', [scriptPath]);
    
    let errorOutput = '';
    
    process.stdout?.on('data', (data: Buffer) => {
      console.log(`Python Output: ${data}`);
    });
    
    process.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString();
      console.error(`Python Error: ${data}`);
    });
    
    process.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}. Error: ${errorOutput}`));
      }
    });

    process.on('error', (error: Error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
}

interface CityData {
  city: string;
  temperature: number;
  apiCall: number;
}

// Function to read CSV data
async function readCsvData(city: string): Promise<CityData[]> {
  try {
    const csvPath = '/app/debug-api/generated-artifacts/csvs/' + city + '.csv';
    const content = await readFile(csvPath, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header
    return lines
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const [id, city, temp, apiCall] = line.split(',');
        return {
          city,
          temperature: parseFloat(temp),
          apiCall: parseInt(apiCall, 10)
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
      console.log('Build phase detected, returning mock data');
      return NextResponse.json({
        x: [1, 2, 3, 4, 5],
        y: [20, 22, 25, 21, 23],
        labels: ['City1', 'City2'],
        values: [111, 222],
        cities: ['City1', 'City2']
      });
    }

    // Run database API script to generate fresh CSVs
    try {
      console.log('Running database API script...');
      const dbApiPath = '/app/debug-api/apis/databasePostgresApi.py';
      await runPythonScript(dbApiPath);
      console.log('Database API script completed successfully');
    } catch (error) {
      console.error('Error running database API script:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: continuing with existing CSV files');
      } else {
        throw error;
      }
    }
    
    // Run chart generation scripts
    console.log('Running chart generation scripts...');
    try {
      const pieChartPath = '/app/debug-api/charts/pieChart.py';
      const bubbleChartPath = '/app/debug-api/charts/bubbleChart.py';
      await Promise.all([
        runPythonScript(pieChartPath).catch(error => {
          console.error('Error running pie chart script:', error);
          throw error;
        }),
        runPythonScript(bubbleChartPath).catch(error => {
          console.error('Error running bubble chart script:', error);
          throw error;
        })
      ]);
      console.log('Chart generation scripts completed successfully');
    } catch (error) {
      console.error('Error running chart scripts:', error);
      throw error;
    }
    
    // Read configuration to get city list
    console.log('Reading configuration...');
    const configPath = '/app/configuration.yml';
    const configContent = await readFile(configPath, 'utf8');
    const cities = configContent.match(/realTimeProduction:\n\s+cities:\n((?:\s+-\s+.*\n)*)/)?.[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/\s+-\s+/, ''));
    
    if (!cities) {
      throw new Error('Could not parse cities from configuration');
    }
    
    // Read data from CSVs
    console.log('Reading CSV data...');
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
    console.error('Error in GET request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({
      error: errorMessage,
      x: [],
      y: [],
      labels: [],
      values: [],
      cities: []
    }, { status: 500 });
  }
} 