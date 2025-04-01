import { NextResponse } from 'next/server';
import Docker from 'dockerode';

export async function GET() {
  const docker = new Docker();
  
  try {
    const container = await docker.getContainer('global-city-streaming-flink-processor-1');
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 50,
      timestamps: true
    });

    // Convert logs to string and filter for DB insertion logs
    const logsStr = logs.toString('utf8');
    const dbLogs = logsStr
      .split('\n')
      .filter((line: string) => line.includes('Inserting into DB:'))
      .join('\n');

    return new NextResponse(dbLogs);
  } catch (error) {
    console.error('Error fetching Flink DB logs:', error);
    return new NextResponse('Error fetching logs', { status: 500 });
  }
} 