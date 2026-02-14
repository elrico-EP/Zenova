import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import type { Nurse, Schedule, WorkZone, RuleViolation, Agenda, ActivityLevel, ScheduleCell, Notes, CustomShift, Hours, JornadaLaboral, SpecialStrasbourgEvent, DailyNote, SwapInfo } from '../types';
import { SHIFTS } from '../constants';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getScheduleCellHours, getShiftsFromCell } from '../utils/scheduleUtils';
import { holidays2026 } from '../data/agenda2026';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslations } from '../hooks/useTranslations';
import { supabase } from '../utils/supabase'
import { Locale } from '../translations/locales';
import { guardarTurno, cargarTurnosMes, escucharCambiosTurnos } from '../utils/turnoService'

const activityStyles: Record<ActivityLevel, { bg: string; text: string; weekBg: string; weekText: string }> = {
  NORMAL: { bg: 'bg-slate-50', text: 'text-slate-800', weekBg: 'bg-slate-600', weekText: 'text-white' },
  SESSION: { bg: 'bg-rose-100', text: 'text-rose-900', weekBg: 'bg-rose-700', weekText: 'text-white' },
  WHITE_GREEN: { bg: 'bg-emerald-50', text: 'text-emerald-800', weekBg: 'bg-emerald-600', weekText: 'text-white' },
  REDUCED: { bg: 'bg-amber-50', text: 'text-amber-800', weekBg: 'bg-amber-600', weekText: 'text-white' },
  CLOSED: { bg: 'bg-gray-200', text: 'text-gray-600', weekBg: 'bg-gray-500', weekText: 'text-white' }
};

const DayHeaderCell: React.FC<{ day: number, dayOfWeek: string, isWeekend: boolean, activityLevel: ActivityLevel, isNewWeek: boolean, weekId: string, weekLabel: string }> = ({ day, dayOfWeek, isWeekend, activityLevel, isNewWeek, weekId, weekLabel }) => {
    const style = activityStyles[activityLevel];
    const finalBg = isWeekend ? 'bg-gray-200' : style.bg;
    const textColor = isWeekend ? 'text-gray-700' : style.text;

    return (
        <div className={`w-full h-full flex flex-col ${finalBg}`}>
            {isNewWeek && (
                <div className={`h-5 ${style.weekBg} ${style.weekText} flex items-center justify-center flex-shrink-0`}>
                    <span className="font-bold text-xs tracking-wider">{weekLabel} {weekId.split('-W')[1]}</span>
                </div>
            )}
            <div className={`flex-grow flex items-center justify-center gap-2 ${textColor}`}>
                <span className="text-2xl font-bold">{day}</span>
                <span className="text-xs font-medium uppercase tracking-wider">{dayOfWeek}</span>
            </div>
        </div>
    );
};

export const ShiftCell: React.FC<{
    shiftCell: ScheduleCell | undefined;
    hours: string | { morning: string; afternoon: string } | string[];
    hasManualHours: boolean;
    violation?: RuleViolation;
    isWeekend: boolean;
    isClosingDay: boolean;
    nurseId: string;
    weekId: string;
    activityLevel: ActivityLevel;
    strasbourgAssignments: Record<string, string[]>;
    specialEvent?: SpecialStrasbourgEvent;
    dayOfWeek: number;
    isShortFriday: boolean;
}> = ({ shiftCell, hours, hasManualHours, violation, isWeekend, isClosingDay, nurseId, weekId, activityLevel, strasbourgAssignments, specialEvent, dayOfWeek, isShortFriday }) => {
    const t = useTranslations();
    const attendees = strasbourgAssignments[weekId] || [];
    const title = violation?.message || (typeof shiftCell === 'string' ? t[SHIFTS[shiftCell]?.description as keyof Locale] as string : '');
    const hasMultipleHourLines = Array.isArray(hours) && hours.length > 1;

    if (specialEvent) {
        return (
            <div
                className="w-full h-full p-1 flex items-center justify-center relative"
                title={`${specialEvent.name}${specialEvent.notes ? `\n\nNotas: ${specialEvent.notes}` : ''}`}
            >
                <div className="w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm bg-purple-200 text-purple-800 font-bold text-xs text-center">
                    <span className="truncate px-1">{specialEvent.name}</span>
                </div>
            </div>
        );
    }

    const renderHours = () => {
        if (Array.isArray(hours)) {
            return hours.map((line, index) => (
                <span key={index} className="block text-[10px] leading-tight opacity-90 text-center font-semibold">
                    {line}
                </span>
            ));
        }
        if (typeof hours === 'string' && hours) {
            return <span className={`block text-[10px] leading-tight opacity-90 text-center ${hasManualHours ? 'font-semibold' : ''}`}>{hours}</span>;
        }
        return null;
    }

    if (activityLevel === 'SESSION' && dayOfWeek >= 1 && dayOfWeek <= 4 && attendees.includes(nurseId)) {
        const shift = SHIFTS['STRASBOURG'];
        return (
            <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={t[shift.description as keyof Locale] as string}>
                <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${shift.color} ${shift.textColor}`}>
                    <span className="font-bold text-base">{shift.label}</span>
                </div>
            </div>
        );
    }

    if (!shiftCell) {
        const style = activityStyles[activityLevel] || activityStyles['NORMAL'];
        const bgColor = isClosingDay ? 'bg-emerald-50/50' : isWeekend ? 'bg-slate-100/80' : style.bg;
        return <div className={`w-full h-full ${bgColor} relative`}></div>;
    }
    
    if (typeof shiftCell === 'object' && 'custom' in shiftCell) {
        const customShift = shiftCell as CustomShift;

        // Special rendering for STR-PREP: same background, no text.
        if (customShift.custom === 'STR-PREP') {
            const shift = SHIFTS['STRASBOURG'];
            return (
                <div 
                    className={`w-full h-full p-1 flex items-center justify-center relative rounded-md shadow-sm ${shift.color}`}
                    title={t[shift.description as keyof Locale] as string}
                >
                    {/* No text content rendered here */}
                </div>
            );
        }

        const shiftStyle = customShift.type ? SHIFTS[customShift.type] : null;
        const bgColor = shiftStyle ? shiftStyle.color : 'bg-white';
        const textColor = shiftStyle ? shiftStyle.textColor : 'text-slate-700';
        
        const [mainLabel, ...notes] = customShift.custom.split('\n');

        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-center p-1 ${bgColor} ${textColor} font-medium text-xs rounded-md shadow-sm relative`} title={customShift.custom}>
                <span className="font-semibold">{mainLabel}</span>
                {customShift.time && <span className="text-[11px] opacity-80 font-mono">({customShift.time})</span>}
                {notes.length > 0 && <p className="text-[9px] leading-tight opacity-70 mt-0.5 truncate">{notes.join(' ')}</p>}
            </div>
        );
    }

    if (typeof shiftCell === 'object' && 'split' in shiftCell) {
        if (typeof hours === 'string' || Array.isArray(hours)) { 
             return (
                <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={title}>
                    <div className={`w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 rounded-md shadow-sm bg-purple-200 text-purple-800 ${violation ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                        <span className="font-bold text-base">Split</span>
                        {renderHours()}
                    </div>
                </div>
             )
        }
        
        const [morningPart, afternoonPart] = shiftCell.split;
        const getShiftData = (part: ScheduleCell) => typeof part === 'string' ? SHIFTS[part as WorkZone] : null;
        const morningShiftData = getShiftData(morningPart);
        const afternoonShiftData = getShiftData(afternoonPart);

        return (
            <div className="w-full h-full flex flex-col gap-0.5 p-0.5 relative" title={title}>
                {morningShiftData && (
                    <div className={`flex-grow min-h-0 flex flex-col items-center justify-center rounded-sm text-center p-1 ${morningShiftData.color} ${morningShiftData.textColor}`}>
                        <span className="font-semibold text-xs leading-tight">{morningShiftData.label}</span>
                        <span className="text-[10px] leading-tight opacity-90">{hours.morning}</span>
                    </div>
                )}
                {afternoonShiftData && (
                    <div className={`flex-grow min-h-0 flex flex-col items-center justify-center rounded-sm text-center p-1 ${afternoonShiftData.color} ${afternoonShiftData.textColor}`}>
                        <span className="font-semibold text-xs leading-tight">{afternoonShiftData.label}</span>
                        <span className="text-[10px] leading-tight opacity-90">{hours.afternoon}</span>
                    </div>
                )}
            </div>
        );
    }
    
    const shift = SHIFTS[shiftCell as WorkZone];
    if (!shift) return <div className="w-full h-full bg-white/80 relative"></div>;

    let displayLabel = shift.label;
    if (isShortFriday && (shift.id === 'URGENCES' || shift.id === 'TRAVAIL')) {
      displayLabel = displayLabel.replace(' M', '');
    }

    return (
        <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={title}>
            <div className={`w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 rounded-md shadow-sm ${shift.color} ${shift.textColor} ${violation ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                <span className={`font-bold ${hasMultipleHourLines ? 'text-sm' : 'text-base'}`}>{displayLabel}</span>
                {renderHours()}
            </div>
        </div>
    );
};

const NOTE_COLORS = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100', 'bg-gray-100', 'bg-white'];

const EditableNoteCell: React.FC<{
  note: DailyNote | undefined;
  dateKey: string;
  isWeekend: boolean;
  canEdit: boolean;
  onNoteChange: (dateKey: string, text: string, color: string) => void;
}> = ({ note, dateKey, isWeekend, canEdit, onNoteChange }) => {
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
    // 🔄 Cargar turnos al iniciar y escuchar cambios
    useEffect(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        // Cargar turnos de Supabase
        const cargarDatos = async () => {
            const resultado = await cargarTurnosMes(year, month)
            if (resultado.success && resultado.data) {
                // Aquí fusionarías con tu schedule actual
                console.log('Turnos cargados de Supabase:', resultado.data)
            }
        }
        
        cargarDatos()
        
        // Escuchar cambios en tiempo real
        const dejarDeEscuchar = escucharCambiosTurnos((payload) => {
            // Cuando otro usuario cambia algo, recargamos
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                alert('¡Otro usuario ha modificado los turnos! Recargando...')
                cargarDatos()
            }
        })
        
        return () => {
            dejarDeEscuchar()
        }
    }, [currentDate])
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
          ) : (
              canEdit && <div className="text-slate-400 italic self-start">{t.addNotePlaceholder}</div>
          )}
      </div>
  );
};


interface ScheduleGridProps {
  nurses: Nurse[];
  schedule: Schedule;
  currentDate: Date;
  violations: RuleViolation[];
  agenda: Agenda;
  notes: Notes;
  hours: Hours;
  onNoteChange: (dateKey: string, text: string, color: string) => void;
  vaccinationPeriod: { start: string; end: string } | null;
  zoomLevel: number;
  strasbourgAssignments: Record<string, string[]>;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  isMonthClosed: boolean;
  jornadasLaborales: JornadaLaboral[];
  visualSwaps: Record<string, Record<string, SwapInfo>>;
  onCellDoubleClick: (dateKey: string, nurseId: string) => void;
}

const EXCLUDED_SHIFTS = new Set<WorkZone>(['TW', 'FP', 'SICK_LEAVE', 'RECUP', 'CA', 'STRASBOURG']);

const getShiftLabel = (cell: ScheduleCell | undefined): string => {
    if (!cell) return 'Libre';
    const shifts = getShiftsFromCell(cell);
    if (shifts.length === 0) {
        if (typeof cell === 'object' && 'custom' in cell) return cell.custom.split('\n')[0];
        return 'N/A';
    }
    return shifts.map(s => SHIFTS[s]?.label || s).join(' / ');
};

export const BASE_CELL_WIDTH = 140;
export const DAY_COL_WIDTH = 100;
export const PRESENT_COL_WIDTH = 70;
export const NOTES_COL_WIDTH = 140;

export const ScheduleGrid = React.forwardRef<HTMLDivElement, ScheduleGridProps>(({ nurses, schedule, currentDate, violations, agenda, notes, hours, onNoteChange, zoomLevel, strasbourgAssignments, specialStrasbourgEvents, isMonthClosed, jornadasLaborales, visualSwaps, onCellDoubleClick }, ref) => {
    const { language } = useLanguage();
    const permissions = usePermissions();
    const t = useTranslations();
      // BOTÓN DE PRUEBA - Función para verificar conexión
    const probarSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('turnos')
                .select('*')
            
            if (error) {
                console.error('Error:', error)
                alert('❌ Error de conexión: ' + error.message)
            } else {
                console.log('✅ Datos:', data)
                alert('✅ ¡Conexión exitosa! Encontrados ' + data.length + ' turnos.')
            }
        } catch (err) {
            console.error('Error inesperado:', err)
            alert('❌ Error: ' + err)
        }
    }
        // 🔄 ESCUCHAR CAMBIOS EN TIEMPO REAL DE SUPABASE
    useEffect(() => {
        const canal = supabase
            .channel('cambios-turnos')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'turnos' },
                (payload) => {
                    console.log('Cambio recibido de otro usuario:', payload)
                    
                    // Aquí puedes recargar los datos o mostrar una notificación
                    // Por ejemplo, podrías llamar a una función para refrescar el schedule
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                        // Opción 1: Recargar la página automáticamente (simple pero brusco)
                        // window.location.reload()
                        
                        // Opción 2: Mostrar aviso al usuario para que recargue manualmente
                        alert('¡Atención! Otro usuario ha modificado los turnos. Recarga la página para ver los cambios.')
                    }
                }
            )
            .subscribe()
                // Función para guardar un turno en Supabase (se verá en todos los ordenadores)
    const guardarTurnoEnSupabase = async (nurseId: string, dateKey: string, shiftCell: ScheduleCell) => {
        try {
            // Primero buscamos si ya existe un turno para esta enfermera y fecha
            const { data: existente } = await supabase
                .from('turnos')
                .select('id')
                .eq('nurse_id', nurseId)
                .eq('fecha', dateKey)
                .single()

            const turnoData = {
                nurse_id: nurseId,
                fecha: dateKey,
                turno: JSON.stringify(shiftCell), // Guardamos el turno como texto JSON
                actualizado_por: 'Usuario Actual', // Puedes cambiar esto por el nombre real del usuario
                updated_at: new Date().toISOString()
            }

            if (existente) {
                // Actualizar turno existente
                const { error } = await supabase
                    .from('turnos')
                    .update(turnoData)
                    .eq('id', existente.id)
                
                if (error) throw error
                console.log('Turno actualizado en Supabase')
            } else {
                // Crear nuevo turno
                const { error } = await supabase
                    .from('turnos')
                    .insert([turnoData])
                
                if (error) throw error
                console.log('Turno creado en Supabase')
            }
        } catch (error) {
            console.error('Error guardando en Supabase:', error)
            alert('Error al guardar el turno. Inténtalo de nuevo.')
        }
    }
    // BOTÓN DE PRUEBA - Lo quitaremos después
    const probarSupabase = async () => {
        try {
            // Intentamos leer los turnos
            const { data, error } = await supabase
                .from('turnos')
                .select('*')
            
            if (error) {
                console.error('Error:', error)
                alert('❌ Error de conexión: ' + error.message)
            } else {
                console.log('✅ Datos recibidos:', data)
                alert('✅ ¡Conexión exitosa! Hay ' + data.length + ' turnos guardados.')
            }
        } catch (err) {
            console.error('Error inesperado:', err)
            alert('❌ Error inesperado: ' + err)
        }
    }
      return () => {
            supabase.removeChannel(canal)
        }
    }, [])
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    let lastWeekId: string | null = null;
    
    return (
        <    return (
        <div ref={ref} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 overflow-auto print-grid-container" style={{ maxHeight: 'calc(100vh - 270px)' }}>
            
            {/* BOTÓN DE PRUEBA SUPABASE */}
            <button 
                onClick={probarSupabase}
                style={{
                    position: 'fixed', 
                    top: '10px', 
                    right: '10px', 
                    zIndex: 9999, 
                    padding: '15px', 
                    background: '#22c55e', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                🔌 Probar Conexión Supabase
            </button>
            
            <table className="min-w-full border-collapse table-fixed">
                🔌 Probar Conexión Supabase
            </button>
          <table className="min-w-full border-collapse table-fixed">
                <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm">
                    <tr>
                        <th className="sticky top-0 left-0 z-30 bg-white border-b-2 border-slate-200" style={{ width: `${DAY_COL_WIDTH * zoomLevel}px` }}></th>
                        {nurses.map(nurse => {
                            return (
                                <th key={nurse.id} className="h-16 text-center border-b-2 border-slate-200 px-1" style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px`, minWidth: `${BASE_CELL_WIDTH * zoomLevel}px`, maxWidth: `${BASE_CELL_WIDTH * zoomLevel}px` }}>
                                    <span className="font-semibold text-slate-700 truncate text-sm block">{nurse.name}</span>
                                </th>
                            );
                        })}
                        <th className="h-16 text-center border-b-2 border-slate-200 no-print" style={{ width: `${PRESENT_COL_WIDTH * zoomLevel}px`}}><span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">{t.present}</span></th>
                        <th className="h-16 text-center border-b-2 border-slate-200 no-print" style={{ width: `${NOTES_COL_WIDTH * zoomLevel}px` }}><span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">{t.notes}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {days.map(day => {
                        const date = new Date(year, month, day);
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayOfWeekStr = date.toLocaleString(language, { weekday: 'short' });
                        const dayOfWeek = date.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const weekId = getWeekIdentifier(date);
                        const isHoliday = year === 2026 && holidays2026.has(dateKey);
                        const activityLevel = agenda[weekId] || 'NORMAL';
                        const isNewWeek = weekId !== lastWeekId;
                        lastWeekId = weekId;

                        let presentCount = 0;
                        nurses.forEach(nurse => {
                            const shiftCell = schedule[nurse.id]?.[dateKey];
                            if (shiftCell && !((typeof shiftCell === 'string') && EXCLUDED_SHIFTS.has(shiftCell as WorkZone))) presentCount++;
                        });

                        const dayHeader = <td className="sticky left-0 z-10 border-r border-b border-gray-200/80" style={{ width: `${DAY_COL_WIDTH * zoomLevel}px`}}><DayHeaderCell day={day} dayOfWeek={dayOfWeekStr} isWeekend={isWeekend} activityLevel={activityLevel} isNewWeek={isNewWeek} weekId={weekId} weekLabel={t.week} /></td>;
                        const presentCell = <td className={`h-16 border-b border-r border-gray-200/80 text-center ${isWeekend ? 'bg-slate-100/80' : 'bg-white/80'} no-print`} style={{ width: `${PRESENT_COL_WIDTH * zoomLevel}px`}}>{presentCount > 0 && <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm shadow-inner ${presentCount < 6 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{presentCount}</div>}</td>;
                        
                        const notesCell = (
                          <td className={`h-16 border-b border-r border-gray-200/80 p-0 no-print`} style={{ width: `${NOTES_COL_WIDTH * zoomLevel}px` }}>
                            <EditableNoteCell
                              note={notes[dateKey]}
                              dateKey={dateKey}
                              isWeekend={isWeekend}
                              canEdit={!isMonthClosed && permissions.canEditGeneralNotes}
                              onNoteChange={onNoteChange}
                            />
                          </td>
                        );

                        if (activityLevel === 'CLOSED' && !isWeekend) {
                            return (
                                <tr key={day} className="group relative">
                                    {dayHeader}
                                    {nurses.map((nurse, nurseIndex) => <td key={nurse.id} className="border-r border-b border-gray-200/80 h-16 bg-gray-200 text-center" style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px` }}>{nurseIndex === Math.floor(nurses.length / 2) && <span className="text-xl font-bold text-gray-500 tracking-wider uppercase select-none">{t.closed}</span>}</td>)}
                                    {presentCell}{notesCell}
                                </tr>
                            );
                        }

                        const nurseCells = nurses.map(nurse => {
                            const isClosingDay = isHoliday || activityLevel === 'CLOSED';
                            const originalShiftCell = schedule[nurse.id]?.[dateKey];
                            const swapInfo = visualSwaps[dateKey]?.[nurse.id];
                            const effectiveShiftCell = swapInfo ? swapInfo.shownShift : originalShiftCell;

                            let tooltip = '';
                            if (swapInfo) {
                                const swappedWithNurseName = nurses.find(n => n.id === swapInfo.swappedWithNurseId)?.name ?? t.unknown;
                                const originalShiftLabel = getShiftLabel(swapInfo.originalShift);
                                tooltip = `Intercambio visual con ${swappedWithNurseName}. Turno real: ${originalShiftLabel}`;
                            }
                            
                            const violation = violations.find(v => (v.nurseId === nurse.id || v.nurseId === 'global') && (v.dateKey === dateKey || (v.weekId === weekId && !v.dateKey)));
                            const isShortFriday = dayOfWeek === 5 && agenda[getWeekIdentifier(new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000))] !== 'SESSION';
                            
                            const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);

                            let displayHours: string | { morning: string; afternoon: string } | string[];
                            const dailyHoursData = hours[nurse.id]?.[dateKey];
                            const hasManualHours = dailyHoursData?.segments?.some(s => s.startTime || s.endTime);

                            if (hasManualHours) {
                                displayHours = dailyHoursData!.segments!.filter(s => s.startTime && s.endTime).map(s => `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`);
                            } else {
                                displayHours = getScheduleCellHours(effectiveShiftCell, nurse, date, activityLevel, agenda);
                            }
                            
                            return (
                                <td 
                                    key={nurse.id} 
                                    title={tooltip} 
                                    className={`relative border-r border-b border-gray-200/80 h-16 hover:bg-nova-50/50 transition-colors ${permissions.canManageSwaps && !isMonthClosed ? 'cursor-pointer' : ''}`}
                                    style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px`, minWidth: `${BASE_CELL_WIDTH * zoomLevel}px`, maxWidth: `${BASE_CELL_WIDTH * zoomLevel}px` }}
                                    onDoubleClick={(e) => {
                                        if (permissions.canManageSwaps && !isMonthClosed) {
                                            e.preventDefault();
                                            onCellDoubleClick(dateKey, nurse.id);
                                        }
                                    }}
                                >
                                    {swapInfo && <span className="absolute top-0.5 right-0.5 text-blue-600 text-xs z-10 bg-white/50 rounded-full p-0.5" aria-label="Turno intercambiado">🔁</span>}
                                    <ShiftCell shiftCell={effectiveShiftCell} hours={displayHours} hasManualHours={!!hasManualHours} violation={violation} isWeekend={isWeekend} isClosingDay={isClosingDay} nurseId={nurse.id} weekId={weekId} activityLevel={activityLevel} strasbourgAssignments={strasbourgAssignments} specialEvent={specialEvent} dayOfWeek={dayOfWeek} isShortFriday={isShortFriday} />
                                </td>
                            );
                        });

                        return <tr key={day} className="group relative">{dayHeader}{nurseCells}{presentCell}{notesCell}</tr>;
                    })}
                </tbody>
            </table>
        </div>
    );
});
ScheduleGrid.displayName = 'ScheduleGrid';
