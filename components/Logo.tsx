import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Círculo de Borda Suave */}
      <div className="absolute inset-0 rounded-full border-[1.5px] border-[#e5b4b7] opacity-60"></div>
      
      {/* Container do Logo */}
      <div className="relative w-full h-full p-2 flex items-center justify-center">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* A Lua */}
          <circle cx="50" cy="50" r="30" fill="#fce4e4" />
          <circle cx="42" cy="40" r="4" fill="#f3d0d0" />
          <circle cx="58" cy="45" r="3" fill="#f3d0d0" />
          <circle cx="48" cy="62" r="5" fill="#f3d0d0" />
          <circle cx="62" cy="58" r="2" fill="#f3d0d0" />
          
          {/* Ondas decorativas na Lua */}
          <path d="M35 55C40 65 60 65 65 55" stroke="white" strokeWidth="2" strokeLinecap="round" />
          
          {/* Flores à Esquerda */}
          <g className="opacity-80">
            <circle cx="32" cy="45" r="4" fill="#a66d70" />
            <circle cx="28" cy="52" r="3" fill="#d49da0" />
            <path d="M30 40C25 35 25 45 30 45" stroke="#a66d70" strokeWidth="0.5" />
          </g>
          
          {/* Flores à Direita */}
          <g className="opacity-80">
            <circle cx="68" cy="55" r="4" fill="#d49da0" />
            <circle cx="72" cy="48" r="3" fill="#a66d70" />
            <path d="M70 60C75 65 75 55 70 55" stroke="#a66d70" strokeWidth="0.5" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export const LunaBrandText: React.FC = () => (
  <span className="font-serif font-black tracking-[0.15em] text-[#a66d70] text-2xl uppercase">Luna</span>
);