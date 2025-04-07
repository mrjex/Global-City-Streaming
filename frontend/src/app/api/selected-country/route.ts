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
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error('Failed to forward country selection');
    }

    // Get the raw text first for debugging
    const rawText = await response.text();
    console.log('Raw API response:', rawText);

    try {
      // Try to parse the text as JSON
      const data = JSON.parse(rawText);
      console.log('Successfully parsed city temperature data');
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      console.error('Raw response that failed to parse:', rawText);
      throw new Error('Invalid JSON response from API');
    }
  } catch (error) {
    console.error('Error forwarding country selection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process country selection',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 