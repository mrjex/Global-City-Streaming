import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import yaml from 'js-yaml';

export async function POST(request: Request) {
  try {
    const { cities } = await request.json();
    
    // Read the current config
    const configPath = '../../../../configuration.yml';
    const currentConfig = require(configPath);
    
    // Update the cities
    currentConfig.realTimeProduction.cities = cities;
    
    // Write back to file
    const yamlStr = yaml.dump(currentConfig);
    await writeFile(configPath, yamlStr, 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
} 