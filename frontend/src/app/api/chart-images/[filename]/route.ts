import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    filename: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const filename = params.filename;

    if (!filename) {
      return NextResponse.json({ error: 'No chart name provided' }, { status: 400 });
    }

    // Build the path to the chart file
    const chartPath = path.resolve(process.cwd(), `city-api/generated-artifacts/charts/${filename}`);

    // Check if the file exists
    if (!fs.existsSync(chartPath)) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
    }

    // Read the file
    const imageBuffer = fs.readFileSync(chartPath);

    // Determine mime type based on file extension
    let mimeType = 'image/png';
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
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