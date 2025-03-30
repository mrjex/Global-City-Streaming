import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ count: 0 });
  }

  const pool = new Pool({
    user: 'postgres',
    host: 'postgres',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  });

  try {
    const result = await pool.query('SELECT COUNT(*) FROM weather');
    await pool.end();
    return NextResponse.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching count:', error);
    try {
      await pool.end();
    } catch (e) {
      console.error('Error closing pool:', e);
    }
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
} 