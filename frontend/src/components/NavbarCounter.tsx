import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Create a simple event emitter for sharing count updates
const countEmitter = {
  listeners: new Set<(count: number) => void>(),
  emit(count: number) {
    this.listeners.forEach(listener => listener(count));
  },
  subscribe(listener: (count: number) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

// Export the emitter for DatabaseCounter to use
export const databaseCountEmitter = countEmitter;

export default function NavbarCounter() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = countEmitter.subscribe((newCount) => {
      setCount(newCount);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex items-center">
      <div className="relative h-8 flex items-center">
        {isLoading ? (
          <div className="animate-pulse bg-gray-700/50 h-8 w-24 rounded"></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <span className="text-4xl font-bold text-transparent bg-clip-text" 
                    style={{ 
                      backgroundImage: 'linear-gradient(135deg, #00ff9d 0%, #00b8d4 50%, #39e75f 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundSize: '200% 200%',
                      animation: 'gradient 5s ease infinite'
                    }}>
                {count.toLocaleString()}
              </span>
              <span className="text-base font-medium text-transparent bg-clip-text"
                    style={{ 
                      backgroundImage: 'linear-gradient(135deg, #7c4dff, #536dfe)',
                      WebkitBackgroundClip: 'text',
                      backgroundSize: '200% 200%',
                      animation: 'gradient 5s ease infinite'
                    }}>
                entries
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 