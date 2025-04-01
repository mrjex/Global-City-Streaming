import { NextResponse } from 'next/server';

export async function GET() {
  // During build time or static generation, return empty array
  if (process.env.NODE_ENV === 'production' && (process.env.NEXT_PHASE === 'build' || process.env.NEXT_PHASE === 'static')) {
    return NextResponse.json([]);
  }

  try {
    // Use localhost during development, container name in production
    const host = process.env.NODE_ENV === 'development' ? 'localhost' : 'frontend';
    const response = await fetch(`http://${host}:8000/flink/logs?type=raw`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Flink raw data logs:', error);
    return NextResponse.json([]);
  }
} 