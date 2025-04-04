import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8003';

export async function POST(request: Request) {
  try {
    const { country } = await request.json();
    console.log(`Processing request for country: ${country}`);
    
    // Forward the country to the city-api container
    const response = await fetch(`${CITY_API_URL}/api/selected-country`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ country }),
    });

    if (!response.ok) {
      throw new Error('Failed to forward country selection');
    }

    const data = await response.json();
    console.log('Received city temperature data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding country selection:', error);
    return NextResponse.json({ error: 'Failed to process country selection' }, { status: 500 });
  }
} 