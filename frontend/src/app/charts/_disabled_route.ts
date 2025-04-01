// This file is disabled to avoid route conflicts with the charts/page.tsx
// The functionality has been moved to /api/chart-images/[filename]/route.ts

/*
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get the chart filename from the URL
    const url = new URL(request.url);
    const chartName = url.pathname.split('/').pop();

    if (!chartName) {
      return NextResponse.json({ error: 'No chart name provided' }, { status: 400 });
    }

    // Build the path to the chart file
    const chartPath = path.resolve(process.cwd(), `debug-api/generated-artifacts/charts/${chartName}`);

    // Check if the file exists
    if (!fs.existsSync(chartPath)) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
    }

    // Read the file
    const imageBuffer = fs.readFileSync(chartPath);

    // Determine mime type based on file extension
    let mimeType = 'image/png';
    if (chartName.endsWith('.jpg') || chartName.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    }

    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error serving chart image:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/ 