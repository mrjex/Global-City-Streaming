'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DatabaseCounter() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/count');
        if (!response.ok) {
          throw new Error('Failed to fetch count');
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setCount(data.count);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Error fetching count:', error);
        setError('Connecting to database...');
        // If we've been retrying for more than 30 seconds, show a different message
        if (retryCount > 15) {
          setError('Database connection failed. Please try again later.');
        }
        setRetryCount(prev => prev + 1);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchCount();
      const interval = setInterval(fetchCount, 2000);
      return () => clearInterval(interval);
    }
  }, [retryCount]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Database Entries</h2>
      <div className="relative h-12 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        ) : error ? (
          <div className="text-gray-500">{error}</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute"
            >
              <span className="text-3xl font-bold text-blue-600">{count}</span>
              <span className="ml-2 text-gray-500">records</span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 