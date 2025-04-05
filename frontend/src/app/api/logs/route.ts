import { NextResponse } from 'next/server';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8003';

export async function GET() {
  try {
    const response = await fetch(`${CITY_API_URL}/api/kafka-logs`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch logs:', response.status, response.statusText);
      return NextResponse.json({ logs: [], temperatureData: [] }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ logs: [], temperatureData: [] }, { status: 500 });
  }
} 