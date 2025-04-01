import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    console.log('Fetching DB logs via FastAPI proxy');
    
    // Use FastAPI as a proxy to access the Flink processor
    // This request will be handled by the FastAPI server running in the same container
    console.log('Request URL: http://127.0.0.1:8000/proxy/flink/logs/db');
    
    const response = await fetch(`http://127.0.0.1:8000/proxy/flink/logs/db`, {
      cache: 'no-store'
    });

    console.log('Response status:', response.status, response.statusText);
    try {
      const headerEntries = response.headers.entries();
      const headerArray = Array.from(headerEntries);
      console.log('Response headers:', headerArray.map(([k, v]) => `${k}: ${v}`).join(', '));
    } catch (err) {
      console.log('Could not iterate headers:', err);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
    }

    const logs = await response.text();
    console.log('DB logs received - length:', logs ? logs.length : 0);
    console.log('DB logs type:', typeof logs);
    console.log('DB logs empty?', !logs || logs.trim() === '');
    console.log('DB logs sample:', logs ? logs.substring(0, 100) + '...' : 'empty');
    
    if (!logs || logs.trim() === '') {
      console.log('Returning empty array due to empty logs');
      return new NextResponse('[]', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Return logs as plain text with appropriate headers
    console.log('Returning logs with length:', logs.length);
    return new NextResponse(logs, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error fetching Flink processor DB logs:', error);
    console.log('Returning empty array due to error');
    return new NextResponse('[]', {
      status: 200, // Return empty array instead of error
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 