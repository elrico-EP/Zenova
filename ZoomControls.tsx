import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface ZoomControlsProps {
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isFitToScreen: boolean;
  setIsFitToScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoomLevel, setZoomLevel, isFitToScreen, setIsFitToScreen }) => {
  const t = useTranslations();

  const handleZoomIn = () => {
    setIsFitToScreen(false);
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setIsFitToScreen(false);
    setZoomLevel(prev => Math.max(prev - 0.1, 0.25));
  };

  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      <button
        onClick={() => setIsFitToScreen(true)}
        className={`px-3 py-1.5 text-sm font-semibold border rounded-md transition-colors ${
          isFitToScreen 
            ? 'bg-zen-800 text-white border-zen-800' 
            : 'bg-white text-zen-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        {t.fitToScreen}
      </button>
      <div className="flex items-center">
        <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
            aria-label={t.zoomOut}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        </button>
        <span className="px-3 py-1.5 border-t border-b border-gray-300 bg-white text-sm font-semibold text-gray-700 w-20 text-center">
            {isFitToScreen ? 'Auto' : `${Math.round(zoomLevel * 100)}%`}
        </span>
        <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
            aria-label={t.zoomIn}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
    </div>
  );
};