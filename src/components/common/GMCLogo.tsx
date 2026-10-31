import React from 'react';

interface GMCLogoProps {
  className?: string;
  size?: number;
}

export const GMCLogo: React.FC<GMCLogoProps> = ({ className = '', size = 44 }) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-white shadow-md border-2 border-[#12C8F4]/60 overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-0.5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Ring */}
        <circle cx="50" cy="50" r="46" fill="#0A2540" stroke="#06B6D4" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#0A2540" strokeWidth="1" />

        {/* Circular Ring Text Path */}
        <path
          id="gmcTextPathTop"
          d="M 17,50 A 33,33 0 0,1 83,50"
          fill="none"
        />
        <text className="text-[6.5px] font-bold fill-[#0A2540] tracking-wider" textAnchor="middle">
          <textPath href="#gmcTextPathTop" startOffset="50%">
            GANDHIDHAM NAGARPALIKA
          </textPath>
        </text>

        {/* Inner Crest Badge */}
        <circle cx="50" cy="50" r="28" fill="#F0F9FF" stroke="#0284C7" strokeWidth="1.5" />

        {/* Central Lighthouse / Lamp & Anchor Symbol */}
        {/* Ship / Port Waves */}
        <path
          d="M 28 62 Q 38 58 50 62 Q 62 66 72 62 L 72 68 Q 62 72 50 68 Q 38 64 28 68 Z"
          fill="#0284C7"
          opacity="0.85"
        />

        {/* Streetlight / Lighthouse Pole */}
        <path
          d="M 48 30 L 52 30 L 53 58 L 47 58 Z"
          fill="#0A2540"
        />
        {/* Lamp Base & Glowing Light Beam */}
        <path
          d="M 44 30 L 56 30 L 53 26 L 47 26 Z"
          fill="#0284C7"
        />
        {/* Lamp Bulb / Flame */}
        <circle cx="50" cy="24" r="3.5" fill="#12C8F4" />
        <path
          d="M 50 20 L 50 17 M 45 22 L 42 20 M 55 22 L 58 20"
          stroke="#12C8F4"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Anchor Accent */}
        <path
          d="M 44 48 Q 50 53 56 48"
          stroke="#0A2540"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Star Accents */}
        <circle cx="21" cy="52" r="1.5" fill="#0A2540" />
        <circle cx="79" cy="52" r="1.5" fill="#0A2540" />
      </svg>
    </div>
  );
};
