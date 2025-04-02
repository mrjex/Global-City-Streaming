import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// Config file path - adjust based on project structure
const configPath = path.resolve(process.cwd(), '../configuration.yml');

// Helper function to update a nested property using a dot path
const updateNestedProperty = (obj: any, path: string, value: any) => {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return obj;
};

// GET - Retrieve current configuration
export async function GET() {
  try {
    // Read the configuration file
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configFile);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error reading configuration:', error);
    return NextResponse.json({ error: 'Failed to read configuration' }, { status: 500 });
  }
}

// POST - Update configuration
export async function POST(request: Request) {
  try {
    const { path: configPath, config: configUpdate } = await request.json();
    
    // Read existing configuration
    const configFile = fs.readFileSync(path.resolve(process.cwd(), '../configuration.yml'), 'utf8');
    const existingConfig = yaml.load(configFile) as Record<string, any>;
    
    // Update configuration
    const updatedConfig = updateNestedProperty(existingConfig, configPath, configUpdate);
    
    // Write the updated configuration back
    const yamlStr = yaml.dump(updatedConfig, { 
      lineWidth: -1,
      noRefs: true,
      indent: 2
    });
    
    fs.writeFileSync(path.resolve(process.cwd(), '../configuration.yml'), yamlStr);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
} 