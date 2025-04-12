import { NextResponse } from 'next/server';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8003';

export async function GET() {
  try {
    const response = await fetch(`${CITY_API_URL}/api/kafka-logs`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch logs:', response.status, response.statusText);
      return NextResponse.json(
        { 
          logs: [], 
          temperatureData: [],
          error: `Failed to fetch logs: ${response.status} ${response.statusText}`
        }, 
        { status: 200 }  // Return 200 to allow frontend to handle the error
      );
    }

    const data = await response.json();
    
    // Ensure logs is always a string, even if empty
    const logs = data.logs || '';
    const temperatureData = data.temperatureData || [];
    
    return NextResponse.json(
      { 
        logs,
        temperatureData,
        error: null
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { 
        logs: [], 
        temperatureData: [],
        error: 'Failed to fetch logs. Please check container status.'
      },
      { 
        status: 200,  // Return 200 to allow frontend to handle the error
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
} 