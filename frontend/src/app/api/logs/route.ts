import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://kafka-producer:8000/logs');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
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