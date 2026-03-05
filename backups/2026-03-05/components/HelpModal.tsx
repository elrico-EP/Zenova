
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  const helpContent = t.helpManualRedesign;

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-4xl w-full relative transform transition-all flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-4 border-b mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">{helpContent.title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label={t.close}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <main className="overflow-y-auto pr-4 space-y-6">
          {helpContent.sections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-lg text-zen-800 mb-2">{section.title}</h3>
              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                {section.content.map((paragraph, pIndex) => (
                   <div key={pIndex} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: paragraph }} />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};
