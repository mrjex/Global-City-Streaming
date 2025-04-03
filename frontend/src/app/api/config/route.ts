import { NextResponse } from 'next/server';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8003';

// GET - Retrieve current configuration
export async function GET() {
  try {
    const response = await fetch(`${CITY_API_URL}/api/config`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading configuration:', error);
    return NextResponse.json({ error: 'Failed to read configuration' }, { status: 500 });
  }
}

// POST - Update configuration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${CITY_API_URL}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    console.log("########################       PLOTLY JSON DATA RECEIVED         ###################");
    console.log(data);
    console.log("##############################################################################");
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
} 