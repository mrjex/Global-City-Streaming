import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Define the processor URL
const FLINK_PROCESSOR_URL = process.env.FLINK_PROCESSOR_URL || 'http://flink-processor:8001';

export async function GET() {
  try {
    // Fetch the logs from the Flink processor service
    const response = await fetch(`${FLINK_PROCESSOR_URL}/logs/raw`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
    }

    const logs = await response.text();
    
    // Return logs as plain text with appropriate headers
    return new NextResponse(logs, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error fetching Flink processor raw logs:', error);
    return new NextResponse('Error fetching logs: ' + error.message, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 