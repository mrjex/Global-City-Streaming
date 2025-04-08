import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function GET() {
  try {
    // Path to configuration.yml (mounted in the container)
    const configPath = '/app/configuration.yml';
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);
    
    // Extract just the city data
    const cities = {
      static: config.cities || [],
      dynamic: config.dynamicCities?.current || []
    };
    
    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error reading configuration:', error);
    return NextResponse.json(
      { error: 'Failed to read configuration' },
      { status: 500 }
    );
  }
} 