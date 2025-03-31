import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Mark route as dynamic and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
});

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM weather');
      const count = result.rows[0].count;
      
      return new NextResponse(JSON.stringify({ count }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching count:', error);
    return new NextResponse(JSON.stringify({ count: 0 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
} 