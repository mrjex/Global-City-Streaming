import { NextResponse } from 'next/server';
import fs from 'fs';
import yaml from 'js-yaml';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Cache for city coordinates to avoid repeated API calls
let cityCoordinatesCache: Record<string, { lat: number; lng: number }> = {};

// Function to get city coordinates using the Python script
async function getCityCoordinates(cities: string[]): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Executing Python script for ${cities.length} cities`);
      
      // Path to the Python script
      const scriptPath = '/app/shared/weather/city_coordinates.py';
      
      // Check if the script exists
      if (!fs.existsSync(scriptPath)) {
        console.warn(`Python script not found at ${scriptPath}, using fallback coordinates`);
        return resolve({});
      }
      
      // Execute the Python script
      const pythonProcess = spawn('python3', [scriptPath, ...cities]);
      
      let dataString = '';
      let errorString = '';
      
      // Collect data from stdout
      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });
      
      // Collect data from stderr
      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log(`Python: ${data.toString()}`);
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          return resolve({});
        }
        
        try {
          // Clean up the output to extract valid JSON
          const jsonMatch = dataString.match(/\{.*\}/s);
          if (!jsonMatch) {
            console.error('No valid JSON found in Python output');
            return resolve({});
          }
          
          const jsonStr = jsonMatch[0];
          
          // Parse the JSON output
          const result = JSON.parse(jsonStr);
          console.log(`Python script returned coordinates for ${Object.keys(result).length} cities`);
          
          // Check if we have any coordinates
          if (Object.keys(result).length === 0) {
            console.warn('No coordinates returned from Python script');
            return resolve({});
          }
          
          resolve(result);
        } catch (error) {
          console.error('Error parsing Python script output:', error);
          resolve({});
        }
      });
    } catch (error) {
      console.error('Error executing Python script:', error);
      resolve({});
    }
  });
}

export async function GET() {
  try {
    console.log('GET /api/city-coordinates called');
    
    // Path to configuration.yml (mounted in the container)
    const configPath = '/app/configuration.yml';
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);
    
    // Extract city data
    const staticCities = config.cities || [];
    const dynamicCities = config.dynamicCities?.current || [];
    
    console.log(`Found ${staticCities.length} static cities and ${dynamicCities.length} dynamic cities`);
    
    // Combine all cities
    const allCities = [...staticCities, ...dynamicCities];
    
    // Fetch coordinates for cities that aren't in the cache
    const citiesToFetch = allCities.filter(city => !cityCoordinatesCache[city]);
    console.log(`Fetching coordinates for ${citiesToFetch.length} cities`);
    
    if (citiesToFetch.length > 0) {
      // Try to get coordinates from the Python script
      const cityData = await getCityCoordinates(citiesToFetch);
      
      // Update cache with new coordinates
      for (const [city, data] of Object.entries(cityData)) {
        if (data && data.latitude !== undefined && data.longitude !== undefined) {
          console.log(`Caching coordinates for ${city}: ${data.latitude}, ${data.longitude}`);
          cityCoordinatesCache[city] = {
            lat: data.latitude,
            lng: data.longitude
          };
        }
      }
    }
    
    // Prepare response with all city coordinates
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {};
    
    // Add static cities
    for (const city of staticCities) {
      if (cityCoordinatesCache[city]) {
        cityCoordinates[city] = cityCoordinatesCache[city];
      }
    }
    
    // Add dynamic cities
    for (const city of dynamicCities) {
      if (cityCoordinatesCache[city]) {
        cityCoordinates[city] = cityCoordinatesCache[city];
      }
    }
    
    console.log(`Returning coordinates for ${Object.keys(cityCoordinates).length} cities`);
    
    return NextResponse.json({
      static: staticCities,
      dynamic: dynamicCities,
      coordinates: cityCoordinates
    });
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch city coordinates' },
      { status: 500 }
    );
  }
} 