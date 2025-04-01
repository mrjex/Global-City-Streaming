import { NextResponse } from 'next/server';

export async function GET() {
  // During build time, static generation, or if no window object exists (server-side), return empty array
  if (typeof process !== 'undefined' && 
      (process.env.NEXT_PHASE === 'build' || 
       process.env.NEXT_PHASE === 'static' ||
       process.env.NODE_ENV === 'production')) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch('http://localhost:8000/flink/logs?type=raw');
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