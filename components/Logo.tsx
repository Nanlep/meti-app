
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'color' | 'white';
  customUrl?: string; // New: Custom Logo URL
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true, 
  size = 'md',
  variant = 'color',
  customUrl
}) => {
  const sizeClasses = {
    sm: { w: 24, h: 24, text: 'text-xl' },
    md: { w: 32, h: 32, text: 'text-2xl' },
    lg: { w: 48, h: 48, text: 'text-4xl' },
    xl: { w: 64, h: 64, text: 'text-5xl' }
  };

  const dim = sizeClasses[size];
  const color1 = variant === 'color' ? '#6366f1' : '#ffffff'; // Indigo 500
  const color2 = variant === 'color' ? '#818cf8' : '#cbd5e1'; // Indigo 400 or Slate 300

  // White-label Mode: If custom URL is provided, render image instead of SVG
  if (customUrl) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img 
          src={customUrl} 
          alt="Brand Logo" 
          className="object-contain rounded"
          style={{ width: dim.w, height: dim.h }}
        />
        {showText && (
          <span className={`font-bold tracking-tight text-white ${dim.text} leading-none`}>
            {/* If using custom logo, text is often redundant, but we keep it optional */}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={dim.w} 
        height={dim.h} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path 
          d="M24 4L4 14V34L24 44L44 34V14L24 4Z" 
          fill={color1} 
          fillOpacity="0.2" 
          stroke={color1} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M24 13V35" 
          stroke={color1} 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <path 
          d="M13 19L24 25L35 19" 
          stroke={color2} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M24 4L35 19V30L24 25L13 30V19L24 4Z" 
          fill={color1} 
          fillOpacity="0.1"
        />
        <circle cx="24" cy="25" r="3" fill="white" />
      </svg>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold tracking-tight text-white ${dim.text} leading-none`}>
            meti
          </span>
        </div>
      )}
    </div>
  );
};
