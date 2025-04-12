'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DatabaseCounter from '../../components/DatabaseCounter';
import NavbarCounter from '../../components/NavbarCounter';

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="relative">
      {/* Enhanced gradient backdrop with multiple color stops and increased blur */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-blue-900/80 to-gray-900/95 backdrop-blur-md"></div>
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 animate-pulse-slow"></div>
      
      {/* Enhanced top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-sm"></div>
      
      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-24">
          {/* Logo and Title with enhanced gradient */}
          <div className="flex-shrink-0 group py-6">
            <Link href="/" className="flex items-center">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text animate-gradient-slow relative tracking-wide"
                  style={{ 
                    backgroundImage: 'linear-gradient(135deg, #00b8d4, #7c4dff, #00b8d4, #536dfe, #7c4dff)',
                    WebkitBackgroundClip: 'text',
                    backgroundSize: '300% 300%',
                    animation: 'gradient 8s ease infinite'
                  }}>
                Global City Streaming
                {/* Enhanced hover effect line */}
                <span className="absolute bottom-0 left-0 w-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 
                               group-hover:w-full transition-all duration-300"></span>
              </h1>
            </Link>
          </div>

          {/* Center section with counter */}
          <div className="flex-1 flex justify-start pl-16">
            <NavbarCounter />
          </div>

          {/* Navigation Links with enhanced gradient effects */}
          <Link 
            href="/charts" 
            className={`
              relative px-6 py-3 text-base font-medium transition-all duration-300
              ${pathname === '/charts'
                ? 'text-white'
                : 'text-gray-300 hover:text-white'}
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-600/20 before:via-purple-600/20 before:to-blue-600/20 
              before:opacity-0 hover:before:opacity-100 before:transition-opacity before:rounded-lg
              after:absolute after:inset-0 after:border-b-2 after:border-transparent
              hover:after:border-gradient-to-r hover:after:from-blue-500 hover:after:via-purple-500 hover:after:to-blue-500 after:transition-all
              rounded-lg overflow-hidden backdrop-blur-sm hover:scale-105 transform transition-transform
            `}>
              <span className="relative z-10">Charts</span>
          </Link>
        </div>
      </div>

      {/* Enhanced gradient and glow animations */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 100%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(0, 184, 212, 0.2); }
          25% { box-shadow: 0 0 15px rgba(124, 77, 255, 0.3); }
          50% { box-shadow: 0 0 25px rgba(83, 109, 254, 0.4); }
          75% { box-shadow: 0 0 15px rgba(124, 77, 255, 0.3); }
          100% { box-shadow: 0 0 5px rgba(0, 184, 212, 0.2); }
        }

        .animate-gradient-slow {
          animation: gradient 8s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </nav>
  );
};

export default Navigation; 