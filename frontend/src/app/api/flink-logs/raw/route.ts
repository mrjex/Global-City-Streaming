import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8003';

export async function GET() {
  try {
    try {
      const response = await fetch(`${CITY_API_URL}/proxy/flink/logs/raw`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        return new NextResponse(data.logs, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    
    return new NextResponse('', {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error in GET request:', error);
    return new NextResponse('', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 