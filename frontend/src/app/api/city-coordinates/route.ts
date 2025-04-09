import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { spawn } from 'child_process';

// Define a map of known city coordinates for fallback
const knownCityCoordinates: Record<string, { lat: number; lng: number }> = {
  'London': { lat: 51.5074, lng: -0.1278 },
  'Stockholm': { lat: 59.3293, lng: 18.0686 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
  'Moscow': { lat: 55.7558, lng: 37.6173 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Reykjavik': { lat: 64.1265, lng: -21.8174 },
  'Helsinki': { lat: 60.1699, lng: 24.9384 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Venice': { lat: 45.4408, lng: 12.3155 },
  'Lisbon': { lat: 38.7223, lng: -9.1393 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Chernobyl': { lat: 51.2763, lng: 30.2219 },
  'Nairobi': { lat: -1.2921, lng: 36.8219 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Bali': { lat: -8.3405, lng: 115.0920 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Seoul': { lat: 37.5665, lng: 126.9780 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  'Mexico City': { lat: 19.4326, lng: -99.1332 },
  'Honolulu': { lat: 21.3069, lng: -157.8583 },
  'Papeete': { lat: -17.5390, lng: -149.5671 },
  'Juneau': { lat: 58.3019, lng: -134.4197 },
  'Sacramento': { lat: 38.5816, lng: -121.4944 },
  'Tijuana': { lat: 32.5149, lng: -117.0382 },
  'Melbourne': { lat: -37.8136, lng: 144.9631 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Brisbane': { lat: -27.4705, lng: 153.0260 },
  'Perth': { lat: -31.9505, lng: 115.8605 },
  'Adelaide': { lat: -34.9285, lng: 138.6007 },
  'City of Gold Coast': { lat: -28.0167, lng: 153.4000 },
  'Gold Coast': { lat: -28.0167, lng: 153.4000 },
  'Gothenburg': { lat: 57.7089, lng: 11.9746 },
  'Malmö': { lat: 55.6050, lng: 13.0038 },
  'Uppsala': { lat: 59.8586, lng: 17.6389 },
  'Västerås': { lat: 59.6099, lng: 16.5448 },
  'Örebro': { lat: 59.2741, lng: 15.2066 },
  'Linköping': { lat: 58.4108, lng: 15.6214 }
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Cache for city coordinates to avoid repeated API calls
let cityCoordinatesCache: Record<string, { lat: number; lng: number }> = {};

// Function to get city coordinates using the Python script
async function getCityCoordinates(cities: string[]): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Executing Python script for cities: ${cities.join(', ')}`);
      
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
        console.error(`Python script error: ${data}`);
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          console.error(`Error output: ${errorString}`);
          return resolve({});
        }
        
        try {
          // Parse the JSON output
          const result = JSON.parse(dataString);
          console.log(`Python script returned coordinates for ${Object.keys(result).length} cities`);
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
    console.log(`Reading configuration from ${configPath}`);
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);
    
    // Extract city data
    const staticCities = config.cities || [];
    const dynamicCities = config.dynamicCities?.current || [];
    
    console.log(`Found ${staticCities.length} static cities:`, staticCities);
    console.log(`Found ${dynamicCities.length} dynamic cities:`, dynamicCities);
    
    // Combine all cities
    const allCities = [...staticCities, ...dynamicCities];
    console.log(`Total cities: ${allCities.length}`);
    
    // Fetch coordinates for cities that aren't in the cache
    const citiesToFetch = allCities.filter(city => !cityCoordinatesCache[city]);
    console.log(`Cities to fetch: ${citiesToFetch.length}`, citiesToFetch);
    
    if (citiesToFetch.length > 0) {
      console.log(`Fetching coordinates for ${citiesToFetch.length} cities`);
      
      // Try to get coordinates from the Python script
      const cityData = await getCityCoordinates(citiesToFetch);
      
      // Update cache with new coordinates
      for (const [city, data] of Object.entries(cityData)) {
        if (data && data.latitude !== undefined && data.longitude !== undefined) {
          console.log(`Caching coordinates for ${city}:`, data);
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
      } else if (knownCityCoordinates[city]) {
        // Use known coordinates as fallback
        console.log(`Using known coordinates for static city: ${city}`);
        cityCoordinates[city] = knownCityCoordinates[city];
      } else {
        console.warn(`No coordinates found for static city: ${city}`);
      }
    }
    
    // Add dynamic cities
    for (const city of dynamicCities) {
      if (cityCoordinatesCache[city]) {
        cityCoordinates[city] = cityCoordinatesCache[city];
      } else if (knownCityCoordinates[city]) {
        // Use known coordinates as fallback
        console.log(`Using known coordinates for dynamic city: ${city}`);
        cityCoordinates[city] = knownCityCoordinates[city];
      } else {
        console.warn(`No coordinates found for dynamic city: ${city}`);
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