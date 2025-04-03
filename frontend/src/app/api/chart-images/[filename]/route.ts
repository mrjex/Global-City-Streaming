import { NextResponse } from 'next/server';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const CITY_API_URL = process.env.CITY_API_URL || 'http://city-api:8000';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Forward request to city-api
    const response = await fetch(`${CITY_API_URL}/api/chart-images/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chart image: ${response.statusText}`);
    }
    
    // Forward the image response
    const imageData = await response.blob();
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png'
      }
    });
  } catch (error: any) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 