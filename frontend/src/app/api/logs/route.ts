import { NextResponse } from 'next/server';

// This is a dynamic route that should only be called at runtime
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KAFKA_PRODUCER_URL = process.env.KAFKA_PRODUCER_URL || 'http://kafka-producer:8000';

export async function GET() {
  try {
    const response = await fetch('http://kafka-producer:8000/logs', {
      cache: 'no-store',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch logs:', response.status, response.statusText);
      return NextResponse.json({ logs: [] }, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ logs: [] }, { status: 500 });
  }
} 