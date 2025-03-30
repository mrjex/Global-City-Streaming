import { NextResponse } from 'next/server';

// This is a dynamic route that should only be called at runtime
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KAFKA_PRODUCER_URL = process.env.KAFKA_PRODUCER_URL || 'http://kafka-producer:8000';

export async function GET() {
  try {
    const response = await fetch(`${KAFKA_PRODUCER_URL}/logs`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Accept': 'text/plain',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
      return new NextResponse('[]', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const logs = await response.text();
    return new NextResponse(logs, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return new NextResponse('[]', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
} 