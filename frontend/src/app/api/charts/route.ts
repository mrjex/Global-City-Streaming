import { NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Helper function to capture output from Python processes
const getPythonOutput = (pythonProcess: ChildProcess): Promise<string> => {
  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });
    
    pythonProcess.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Python script exited with code ${code}. Error: ${errorOutput}`));
      }
    });
  });
};

interface ConfigType {
  debugApi?: {
    citiesPool?: string[];
  };
}

// Function to parse cities from configuration
const getCitiesFromConfig = (): string[] => {
  try {
    const configPath = path.resolve(process.cwd(), 'configuration.yml');
    if (!fs.existsSync(configPath)) {
      // Create a default config if it doesn't exist
      const defaultConfig: ConfigType = {
        debugApi: {
          citiesPool: ['London', 'Stockholm', 'Toronto', 'Moscow', 'Madrid']
        }
      };
      fs.writeFileSync(configPath, yaml.dump(defaultConfig));
    }
    
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as ConfigType;
    
    if (config && config.debugApi && Array.isArray(config.debugApi.citiesPool)) {
      return config.debugApi.citiesPool;
    }
    
    // Fallback to default cities
    return ['London', 'Stockholm', 'Toronto', 'Moscow', 'Madrid'];
  } catch (error) {
    console.error('Error parsing configuration:', error);
    // Return default cities as fallback
    return ['London', 'Stockholm', 'Toronto', 'Moscow', 'Madrid'];
  }
};

// Ensure the data and output directories exist
const ensureDirectories = (): void => {
  const dirs = [
    path.resolve(process.cwd(), 'city-api/generated-artifacts/csvs'),
    path.resolve(process.cwd(), 'city-api/generated-artifacts/charts')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

export async function GET() {
  try {
    console.log('Reading configuration...');
    const cities = getCitiesFromConfig();
    if (!cities || cities.length === 0) {
      throw new Error('Could not parse cities from configuration');
    }
    
    // Ensure directories exist
    ensureDirectories();
    
    console.log('Reading CSV data...');
    // Sample data generation for cities that might be missing
    for (const city of cities) {
      const csvPath = path.resolve(process.cwd(), `city-api/generated-artifacts/csvs/${city}.csv`);
      if (!fs.existsSync(csvPath)) {
        const sampleData = `city,temperature,timestamp\n${city},20.0,${new Date().toISOString()}`;
        fs.writeFileSync(csvPath, sampleData);
      }
    }
    
    // Run database API script
    console.log('Running database API script...');
    const dbScript = spawn('python3', ['-c', `
import pandas as pd
import os
from datetime import datetime

# Create sample data for cities
cities = ${JSON.stringify(cities)}
output_dir = os.path.join(os.getcwd(), 'city-api/generated-artifacts/csvs')
os.makedirs(output_dir, exist_ok=True)

for city in cities:
    csv_path = os.path.join(output_dir, f"{city}.csv")
    if not os.path.exists(csv_path):
        df = pd.DataFrame({
            "city": [city],
            "temperature": [20.0],
            "timestamp": [datetime.now()]
        })
        df.to_csv(csv_path, index=False)
    print(f"Created or verified data for {city}")
`]);
    
    try {
      await getPythonOutput(dbScript);
      console.log('Database API script completed successfully');
    } catch (error) {
      console.error('Error running database script:', error);
    }
    
    // Run chart generation scripts
    console.log('Running chart generation scripts...');
    const chartScript = spawn('python3', ['-c', `
import pandas as pd
import os
import matplotlib.pyplot as plt
from datetime import datetime
import sys

# Set up paths
output_dir = os.path.join(os.getcwd(), 'city-api/generated-artifacts')
csv_dir = os.path.join(output_dir, 'csvs')
chart_dir = os.path.join(output_dir, 'charts')
os.makedirs(chart_dir, exist_ok=True)

# Process data for cities
cities = ${JSON.stringify(cities)}
dfs = []

for city in cities:
    try:
        csv_path = os.path.join(csv_dir, f"{city}.csv")
        if not os.path.exists(csv_path):
            # Create a sample entry
            df = pd.DataFrame({
                "city": [city],
                "temperature": [20.0],
                "timestamp": [datetime.now()]
            })
            df.to_csv(csv_path, index=False)
        else:
            df = pd.read_csv(csv_path)
            
        # Ensure timestamp is properly formatted
        if "timestamp" not in df.columns:
            df["timestamp"] = datetime.now()
        
        # Add to collection
        dfs.append(df)
    except Exception as e:
        print(f"Error processing {city}: {str(e)}")

# Generate a simple chart with all cities
if dfs:
    combined_df = pd.concat(dfs)
    plt.figure(figsize=(10, 6))
    for city in cities:
        city_data = combined_df[combined_df['city'] == city]
        if not city_data.empty and 'temperature' in city_data.columns:
            plt.bar(city, city_data['temperature'].mean())
    
    plt.title('Average Temperature by City')
    plt.ylabel('Temperature (°C)')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(chart_dir, 'city_temps.png'))
    print(f"Chart saved to {os.path.join(chart_dir, 'city_temps.png')}")
else:
    print("No data available to create chart")
`]);
    
    try {
      await getPythonOutput(chartScript);
      console.log('Chart generation scripts completed successfully');
    } catch (error) {
      console.error('Error running chart scripts:', error);
    }
    
    // Return the list of charts as a response
    const chartDir = path.resolve(process.cwd(), 'city-api/generated-artifacts/charts');
    let charts: string[] = [];
    
    if (fs.existsSync(chartDir)) {
      charts = fs.readdirSync(chartDir)
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
        .map(file => `/api/chart-images/${file}`);
    }
    
    return NextResponse.json({ charts });
  } catch (error: any) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 