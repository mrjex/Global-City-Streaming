import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'raw';
  
  try {
    const response = await fetch(`http://localhost:8000/flink/logs?type=${type}`);
    const data = await response.text();
    return new NextResponse(data);
  } catch (error) {
    console.error('Error fetching Flink logs:', error);
    return new NextResponse('Error fetching logs', { status: 500 });
  }
} 