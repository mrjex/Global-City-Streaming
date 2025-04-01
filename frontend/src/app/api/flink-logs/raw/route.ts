import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    console.log('Fetching raw logs via multiple methods');
    
    // First try: FastAPI proxy
    console.log('Method 1: FastAPI proxy on port 8000');
    let response;
    let logs = '';
    
    try {
      response = await fetch(`http://127.0.0.1:8000/proxy/flink/logs/raw`, {
        cache: 'no-store'
      });
      
      console.log('Response status (Method 1):', response.status, response.statusText);
      
      if (response.ok) {
        logs = await response.text();
        console.log('Method 1 response length:', logs.length);
      } else {
        console.log('Method 1 failed, trying Method 2');
      }
    } catch (error) {
      console.error('Error in Method 1:', error);
      console.log('Method 1 failed, trying Method 2');
    }
    
    // If first method failed, try direct access to flink-processor on port 8001
    if (!logs) {
      console.log('Method 2: Direct to flink-processor on port 8001');
      try {
        // Directly access the API endpoint on the flink-processor
        response = await fetch(`/api/test-connectivity`, {
          cache: 'no-store'
        });
        
        console.log('Test connectivity status:', response.status);
        
        // If connectivity test returns correctly, use it to determine best URL
        if (response.ok) {
          const testResults = await response.json();
          console.log('Connectivity test results:', JSON.stringify(testResults));
          
          // Find the successful connection path from the test results
          const successfulTests = (testResults.tests || []).filter(test => test.success);
          if (successfulTests.length > 0) {
            // Use the first successful URL
            const bestUrl = successfulTests[0].url;
            console.log('Found working connection:', bestUrl);
            
            // Try to fetch logs using this URL
            const directResponse = await fetch(bestUrl + '/logs/raw', {
              cache: 'no-store'
            });
            
            if (directResponse.ok) {
              logs = await directResponse.text();
              console.log('Method 2 response length:', logs.length);
            }
          }
        }
      } catch (error) {
        console.error('Error in Method 2:', error);
      }
    }
    
    // Check if any method succeeded
    if (!logs || logs.trim() === '') {
      console.log('All methods failed, returning empty array');
      return new NextResponse('[]', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Return logs as plain text with appropriate headers
    console.log('Returning logs with length:', logs.length);
    return new NextResponse(logs, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error fetching Flink processor raw logs:', error);
    console.log('Returning empty array due to error');
    return new NextResponse('[]', {
      status: 200, // Return empty array instead of error
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 