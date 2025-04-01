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

    // Convert logs to string and filter for raw data logs
    const logsStr = logs.toString('utf8');
    const rawDataLogs = logsStr
      .split('\n')
      .filter((line: string) => line.includes('Raw data received:'))
      .join('\n');

    return new NextResponse(rawDataLogs);
  } catch (error) {
    console.error('Error fetching Flink raw data logs:', error);
    return new NextResponse('Error fetching logs', { status: 500 });
  }
} 