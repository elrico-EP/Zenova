
import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface NotesPopoverProps {
  top: number;
  left: number;
  initialText: string;
  initialColor: string;
  onClose: () => void;
  onSave: (text: string, color: string) => void;
}

const colors = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100', 'bg-gray-100', 'bg-white'];

export const NotesPopover: React.FC<NotesPopoverProps> = ({ top, left, initialText, initialColor, onClose, onSave }) => {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState(initialColor);
  const popoverRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = () => {
    onSave(text, color);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-50 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 p-3 flex flex-col gap-3"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.addNotePlaceholder}
        rows={4}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-zen-500 focus:border-zen-500 text-sm"
      />
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full ${c} border-2 ${color === c ? 'border-zen-500' : 'border-transparent'} hover:border-gray-400`}
              aria-label={`${t.color} ${c}`}
            />
          ))}
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700 text-sm"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
};