import { readFile, writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import * as yaml from 'js-yaml';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ConfigType {
  realTimeProduction: {
    cities: string[];
  };
}

export async function POST(request: Request) {
  try {
    const { cities } = await request.json();
    
    // Read the current config
    const configPath = '/app/configuration.yml';
    const configContent = await readFile(configPath, 'utf8');
    const currentConfig = yaml.load(configContent) as Partial<ConfigType>;
    
    // Update the cities
    if (!currentConfig.realTimeProduction) {
      currentConfig.realTimeProduction = { cities: [] };
    }
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