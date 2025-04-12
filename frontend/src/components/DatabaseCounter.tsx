'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseCountEmitter } from './NavbarCounter';

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
        // Emit the count update to all listeners
        databaseCountEmitter.emit(data.count);
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
    <div 
      className="w-full max-w-4xl rounded-lg shadow-xl p-6 mb-6"
      style={{
        background: 'linear-gradient(135deg, #1a1b1e, #2a2a2e, #1a1b1e)',
        backgroundSize: '200% 200%',
        animation: 'gradient 15s ease infinite',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}
    >
      <h2 className="text-xl font-semibold text-transparent bg-clip-text mb-4 text-center" 
          style={{ 
            backgroundImage: 'linear-gradient(135deg, #00b8d4, #7c4dff, #00b8d4, #536dfe)',
            WebkitBackgroundClip: 'text',
            backgroundSize: '200% 200%',
            animation: 'gradient 5s ease infinite'
          }}>
        Database Entries
      </h2>
      <div className="relative h-16 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse bg-gray-700 h-8 w-24 rounded"></div>
        ) : error ? (
          <div className="text-gray-400">{error}</div>
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
              <span className="text-4xl font-bold text-transparent bg-clip-text" 
                    style={{ 
                      backgroundImage: 'linear-gradient(135deg, #00ff9d, #00b8d4, #00ff9d, #39e75f)',
                      WebkitBackgroundClip: 'text',
                      backgroundSize: '200% 200%',
                      animation: 'gradient 5s ease infinite'
                    }}>
                {count}
              </span>
              <span className="ml-2 text-gray-400">records</span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 