'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChartsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/charts/view');
  }, [router]);
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirecting to charts page...</p>
    </div>
  );
} 