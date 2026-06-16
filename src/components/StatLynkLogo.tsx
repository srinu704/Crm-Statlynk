import React from 'react';

interface StatLynkLogoProps {
  mode?: 'icon' | 'badge';
  className?: string;
  size?: number;
}

export default function StatLynkLogo({ mode = 'badge', className = '', size }: StatLynkLogoProps) {
  if (mode === 'icon') {
    // Compact icon version for small headers and list buttons
    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className} 
        style={{ width: size || '100%', height: size || '100%' }}
        id="statlynk-logo-icon"
      >
        <defs>
          <linearGradient id="iconBlueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="iconGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
        </defs>
        
        {/* Slanted vertical bars mimicking a fast growth bar chart */}
        <rect x="20" y="55" width="10" height="25" rx="1.5" fill="url(#iconBlueGrad)" />
        <rect x="36" y="42" width="10" height="38" rx="1.5" fill="url(#iconBlueGrad)" />
        <rect x="52" y="28" width="10" height="52" rx="1.5" fill="url(#iconBlueGrad)" />
        <rect x="68" y="15" width="10" height="65" rx="1.5" fill="url(#iconBlueGrad)" />
        
        {/* Curving golden arrow sweeping upwards */}
        <path 
          d="M 12,65 Q 45,55 82,18" 
          fill="none" 
          stroke="url(#iconGoldGrad)" 
          strokeWidth="5" 
          strokeLinecap="round" 
        />
        {/* Arrowhead */}
        <polygon 
          points="82,18 70,20 78,28" 
          fill="url(#iconGoldGrad)" 
        />
        
        {/* bottom green orbit crescent arc */}
        <path 
          d="M 15,76 A 40,15 0 0,0 85,76" 
          fill="none" 
          stroke="#4ade80" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  // Complete polished brand badge
  return (
    <div 
      className={`relative inline-flex flex-col items-center bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl select-none ${className}`} 
      style={{ width: size ? `${size}px` : '100%', maxWidth: '350px' }}
      id="statlynk-logo-badge"
    >
      <svg 
        viewBox="0 0 300 280" 
        className="w-full h-auto"
      >
        <defs>
          {/* Growth bar chart blue gradient */}
          <linearGradient id="badgeBlueGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#072d6a" />
            <stop offset="40%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          {/* Soaring Arrow gold gradient */}
          <linearGradient id="badgeGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          {/* Subtle text shadows and backdrops */}
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.8"/>
          </filter>
        </defs>

        {/* 1. Bar Chart Vertical Blue Bars */}
        <rect x="75" y="130" width="22" height="75" rx="3" fill="url(#badgeBlueGrad)" />
        <rect x="115" y="105" width="22" height="100" rx="3" fill="url(#badgeBlueGrad)" />
        <rect x="155" y="80" width="22" height="125" rx="3" fill="url(#badgeBlueGrad)" />
        <rect x="195" y="55" width="22" height="150" rx="3" fill="url(#badgeBlueGrad)" />

        {/* 2. Golden-Orange Exponential Arrow */}
        <path 
          d="M 50,150 Q 140,135 242,32" 
          fill="none" 
          stroke="url(#badgeGoldGrad)" 
          strokeWidth="11" 
          strokeLinecap="round" 
        />
        {/* Golden Arrow Pointer */}
        <polygon 
          points="244,28 215,31 234,55" 
          fill="url(#badgeGoldGrad)" 
        />

        {/* 3. White branding text block overlay styled in high tech style */}
        <g filter="url(#softShadow)">
          {/* Translucent overlay strip behind text for maximum legibility */}
          <rect x="35" y="148" width="230" height="28" rx="4" fill="#020617" fillOpacity="0.75" />
          
          <text 
            x="150" 
            y="167" 
            fill="#ffffff" 
            fontWeight="bold" 
            fontSize="18" 
            textAnchor="middle" 
            letterSpacing="1.5"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            ST4TLYNK SOLUTIONS
          </text>
        </g>

        {/* 4. Bottom Orbiting green arc */}
        <path 
          d="M 50,183 A 110,48 0 0,0 250,183" 
          fill="none" 
          stroke="#4ade80" 
          strokeWidth="14" 
          strokeLinecap="round" 
        />

        {/* 5. Curved/Centered red Slogan "Infinite possibilities" nestled in the crescent */}
        <text 
          x="150" 
          y="218" 
          fill="#ef4444" 
          fontWeight="900" 
          fontSize="17.5" 
          textAnchor="middle"
          letterSpacing="0.5"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Infinite possibilities
        </text>
      </svg>
    </div>
  );
}
