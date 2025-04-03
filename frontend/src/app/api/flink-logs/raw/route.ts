import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8003';

export async function GET() {
  try {
    console.log('Fetching raw logs from Flink processor');
    
    try {
      const response = await fetch(`${CITY_API_URL}/proxy/flink/logs/raw`, {
        cache: 'no-store'
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response length:', data.logs.length);
        
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