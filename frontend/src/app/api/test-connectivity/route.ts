import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  const results = {
    status: 'Running connection tests',
    tests: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Test 1: FastAPI direct health check
    console.log('Testing FastAPI health endpoint');
    try {
      const response = await fetch('http://127.0.0.1:8000/health', {
        cache: 'no-store'
      });
      const data = await response.json();
      results.tests.push({
        name: 'FastAPI Health Check',
        url: 'http://127.0.0.1:8000/health',
        statusCode: response.status,
        response: data,
        success: response.ok
      });
    } catch (error) {
      results.tests.push({
        name: 'FastAPI Health Check',
        url: 'http://127.0.0.1:8000/health',
        error: error.message,
        success: false
      });
    }

    // Test 2: FastAPI connection test to flink-processor
    console.log('Testing FastAPI -> Flink Processor connection');
    try {
      const response = await fetch('http://127.0.0.1:8000/test-flink-connection', {
        cache: 'no-store'
      });
      const data = await response.json();
      results.tests.push({
        name: 'FastAPI -> Flink Connection Test',
        url: 'http://127.0.0.1:8000/test-flink-connection',
        statusCode: response.status,
        response: data,
        success: response.ok
      });
    } catch (error) {
      results.tests.push({
        name: 'FastAPI -> Flink Connection Test',
        url: 'http://127.0.0.1:8000/test-flink-connection',
        error: error.message,
        success: false
      });
    }

    // Test 3: Proxy endpoints
    console.log('Testing proxy endpoint for raw logs');
    try {
      const response = await fetch('http://127.0.0.1:8000/proxy/flink/logs/raw', {
        cache: 'no-store'
      });
      const text = await response.text();
      results.tests.push({
        name: 'Proxy Raw Logs',
        url: 'http://127.0.0.1:8000/proxy/flink/logs/raw',
        statusCode: response.status,
        responseLength: text.length,
        responsePreview: text.substring(0, 100),
        success: response.ok && text.length > 0
      });
    } catch (error) {
      results.tests.push({
        name: 'Proxy Raw Logs',
        url: 'http://127.0.0.1:8000/proxy/flink/logs/raw',
        error: error.message,
        success: false
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error during connectivity test:', error);
    return NextResponse.json({
      status: 'Error during tests',
      error: error.message,
      tests: results.tests
    }, { status: 500 });
  }
} 