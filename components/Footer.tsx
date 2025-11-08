
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center py-4 mt-8">
      <a
        href="https://T.me/shervini"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-[Arimo] font-medium tracking-wider"
      >
        <span className="bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
          Exclusive SHΞN™ made
        </span>
      </a>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 5s linear infinite;
        }
      `}</style>
    </footer>
  );
};
