'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DatabaseCounter from '../../components/DatabaseCounter';

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="relative">
      {/* Gradient backdrop with blur */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm"></div>
      
      {/* Subtle top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
      
      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex-shrink-0 group">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text animate-gradient relative"
                  style={{ 
                    backgroundImage: 'linear-gradient(135deg, #00b8d4, #7c4dff, #00b8d4, #536dfe)',
                    WebkitBackgroundClip: 'text',
                    backgroundSize: '200% 200%',
                    animation: 'gradient 8s ease infinite'
                  }}>
                Global City Streaming
                {/* Hover effect line */}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 
                               group-hover:w-full transition-all duration-300"></span>
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/charts" 
              className={`
                relative px-4 py-2 text-sm font-medium transition-all duration-300
                ${pathname === '/charts'
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'}
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-600/20 before:to-purple-600/20 
                before:opacity-0 hover:before:opacity-100 before:transition-opacity
                after:absolute after:inset-0 after:border-b-2 after:border-transparent
                hover:after:border-blue-500/50 after:transition-all
                rounded-md overflow-hidden
              `}>
              <span className="relative z-10">Charts</span>
            </Link>
            
          </div>
        </div>
      </div>

      {/* Add gradient and glow animations */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(0, 184, 212, 0.2); }
          50% { box-shadow: 0 0 20px rgba(124, 77, 255, 0.3); }
          100% { box-shadow: 0 0 5px rgba(0, 184, 212, 0.2); }
        }
      `}</style>
    </nav>
  );
};

export default Navigation; 