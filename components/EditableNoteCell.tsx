import React, { useState, useEffect, useRef } from 'react';
import type { DailyNote } from '../types';
import { useTranslations } from '../hooks/useTranslations';

const NOTE_COLORS = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100', 'bg-gray-100', 'bg-white'];

interface EditableNoteCellProps {
  note: DailyNote | undefined;
  dateKey: string;
  isWeekend: boolean;
  canEdit: boolean;
  onNoteChange: (dateKey: string, text: string, color: string) => void;
}

export const EditableNoteCell: React.FC<EditableNoteCellProps> = ({ note, dateKey, isWeekend, canEdit, onNoteChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note?.text || '');
  const [color, setColor] = useState(note?.color || (isWeekend ? 'bg-slate-100' : 'bg-white'));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    setText(note?.text || '');
    setColor(note?.color || (isWeekend ? 'bg-slate-100' : 'bg-white'));
  }, [note, isWeekend]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
    const handleSave = () => {
        if (isEditing) {
            onNoteChange(dateKey, textareaRef.current?.value || '', color);
            setIsEditing(false);
        }
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, dateKey, color, onNoteChange]);
  
  const handleSave = () => {
    onNoteChange(dateKey, text, color);
    setIsEditing(false);
  };
  
  if (isEditing) {
      return (
          <div ref={wrapperRef} className={`w-full h-full flex flex-col ${color} ring-2 ring-nova-400 rounded-md`}>
              <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.addNotePlaceholder}
                  className="w-full flex-grow bg-transparent border-none resize-none text-xs p-1 focus:outline-none"
              />
              <div className="flex justify-between items-center p-1">
                  <div className="flex gap-1">
                      {NOTE_COLORS.map(c => (
                          <button
                              key={c}
                              onClick={() => setColor(c)}
                              className={`w-4 h-4 rounded-full ${c} border ${color === c ? 'ring-2 ring-offset-1 ring-zen-500' : 'border-slate-300'} hover:border-gray-400`}
                          />
                      ))}
                  </div>
                  <button onClick={handleSave} className="px-2 py-0.5 bg-zen-800 text-white font-semibold rounded hover:bg-zen-700 text-xs">
                    {t.save}
                  </button>
              </div>
          </div>
      );
  }

  return (
      <div onClick={() => canEdit && setIsEditing(true)} className={`w-full h-full text-xs p-1 ${color} ${canEdit ? 'cursor-pointer' : ''} hover:ring-2 hover:ring-nova-400/50 rounded-md flex items-center justify-start`}>
          {text ? (
              <p className="line-clamp-3 text-slate-700 whitespace-pre-wrap">{text}</p>
          ) : canEdit ? (
              <div className="text-slate-400 italic self-start">{t.addNotePlaceholder}</div>
          ) : null}
      </div>
  );
};
