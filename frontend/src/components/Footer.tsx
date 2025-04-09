import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 px-4 mt-8" style={{
      background: 'linear-gradient(135deg, #0a0a1a, #1a1b1e, #0a0a1a)',
      backgroundSize: '200% 200%',
      animation: 'gradient 15s ease infinite'
    }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold text-transparent bg-clip-text mb-4" 
              style={{ 
                backgroundImage: 'linear-gradient(135deg, #00b8d4, #7c4dff)',
                WebkitBackgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient 5s ease infinite'
              }}>
            Global City Streaming
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Real-time data visualization of global city metrics through Kafka-Flink streaming analytics.
          </p>
          <a 
            href="https://github.com/mrjex/Global-City-Streaming" 
            className="text-cyan-400 hover:text-purple-400 transition-colors duration-300 text-sm flex items-center"
            style={{
              position: 'relative',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(0)';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View Project on GitHub
          </a>
        </div>
        
        <div className="flex flex-col items-start">
          <h4 className="text-white font-medium mb-4">Contact</h4>
          <a 
            href="https://github.com/mrjex" 
            className="text-cyan-400 hover:text-purple-400 transition-colors duration-300 mb-2 flex items-center"
            style={{
              position: 'relative',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(0)';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            @mrjex
          </a>
          <a 
            href="mailto:joel.mattsson@hotmail.se" 
            className="text-cyan-400 hover:text-purple-400 transition-colors duration-300 mb-2 flex items-center"
            style={{
              position: 'relative',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(0)';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            joel.mattsson@hotmail.se
          </a>
          <a 
            href="https://joelmattsson.com" 
            className="text-cyan-400 hover:text-purple-400 transition-colors duration-300 flex items-center"
            style={{
              position: 'relative',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(0)';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" clipRule="evenodd" />
            </svg>
            joelmattsson.com
          </a>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-gray-800 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Joel Mattsson. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 