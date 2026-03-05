import React from 'react';

export const ZenovaLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Zenova Logo"
    >
        {/* The nova orange part of the yin-yang */}
        <path
            d="M12 2 A10 10 0 0 1 12 22 A5 5 0 0 1 12 12 A5 5 0 0 0 12 2 Z"
            fill="#f97316"
        />
        {/* The zen blue part of the yin-yang */}
        <path
            d="M12 2 A10 10 0 0 0 12 22 A5 5 0 0 0 12 12 A5 5 0 0 1 12 2 Z"
            fill="#0369a1"
        />
        {/* The nova star in the center */}
        <polygon
            points="12,9 13,11 15,12 13,13 12,15 11,13 9,12 11,11"
            fill="white"
        />
    </svg>
);