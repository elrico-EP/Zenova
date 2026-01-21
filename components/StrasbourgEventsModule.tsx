import React, { useState, useMemo, useEffect } from 'react';
import type { Nurse, SpecialStrasbourgEvent, User, SpecialStrasbourgEventType } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Locale } from '../translations/locales';

interface StrasbourgEventsModuleProps {
    events: SpecialStrasbourgEvent[];
    nurses: Nurse[];
    onEventsChange: (events: SpecialStrasbourgEvent[]) => void;
    isAdmin: boolean;
    effectiveUser: User | Nurse | null;
}

const checkDaysOfWeek = (start: string, end: string, expectedDay: number): boolean => {
    if (!start || !end) return true;
    try {
        const current = new Date(start + 'T12:00:00Z');
        const last = new Date(end + 'T12:00:00Z');
        while(current <= last) {
            if (current.getUTCDay() !== expectedDay) return false;
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return true;
    } catch(e) {
        console.error("Date validation error:", e);
        return false;
    }
};


const EventForm: React.FC<{
    event: Partial<SpecialStrasbourgEvent>;
    nurses: Nurse[];
    onSave: (event: Omit<SpecialStrasbourgEvent, 'id'> & { id?: string }) => void;
    onCancel: () => void;
}> = ({ event, nurses, onSave, onCancel }) => {
    const t = useTranslations();
    const [name, setName] = useState(event?.name || '');
    const [startDate, setStartDate] = useState(event?.startDate || '');
    const [endDate, setEndDate] = useState(event?.endDate || '');
    const [startTime, setStartTime] = useState(event?.startTime || '');
    const [endTime, setEndTime] = useState(event?.endTime || '');
    const [nurseIds, setNurseIds] = useState(event?.nurseIds || []);
    const [notes, setNotes] = useState(event?.notes || '');
    const [error, setError] = useState('');

    const type = event?.type || 'other';
    const isFixedType = type !== 'other';

    useEffect(() => {
        setName(event?.name || '');
        setStartDate(event?.startDate || '');
        setEndDate(event?.endDate || '');
        setStartTime(event?.startTime || '');
        setEndTime(event?.endTime || '');
        setNurseIds(event?.nurseIds || []);
        setNotes(event?.notes || '');
    }, [event]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (type === 'tuesday_permanence' && !checkDaysOfWeek(startDate, endDate, 2)) {
            setError(t.validation_only_tuesdays);
            return;
        }
        if (type === 'wednesday_permanence' && !checkDaysOfWeek(startDate, endDate, 3)) {
            setError(t.validation_only_wednesdays);
            return;
        }

        const dataToSave: Omit<SpecialStrasbourgEvent, 'id'> & { id?: string } = { id: event?.id, name, startDate, endDate, startTime, endTime, nurseIds, notes, type };
        
        // Ensure fixed data is correct on save
        if(type === 'euroscola') { dataToSave.name = t.event_type_euroscola; dataToSave.startTime = '08:00'; dataToSave.endTime = '17:00'; }
        if(type === 'tuesday_permanence') { dataToSave.name = t.event_type_tuesday_permanence; dataToSave.startTime = '13:30'; dataToSave.endTime = '18:30'; }
        if(type === 'wednesday_permanence') { dataToSave.name = t.event_type_wednesday_permanence; dataToSave.startTime = '09:30'; dataToSave.endTime = '14:30'; }

        onSave(dataToSave);
    };

    return (
        <div className="flex flex-col bg-slate-50 max-h-[80vh]">
            <header className="p-4 border-b border-slate-200 bg-white flex-shrink-0 flex items-center gap-4">
                 <button onClick={onCancel} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h3 className="font-bold text-lg text-slate-800">{event?.id ? t.editEvent : t.createEvent}</h3>
            </header>

            <form id="event-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-4 space-y-4 text-sm">
                {error && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md font-medium">{error}</p>}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-2">{t.eventInfo}</h4>
                    <div>
                        <label className="block font-medium text-slate-600">{t.eventName}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required readOnly={isFixedType} className="mt-1 w-full p-2 border border-slate-300 rounded-md read-only:bg-slate-100 read-only:text-slate-500" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">{t.startDate}</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">{t.endDate}</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" min={startDate} />
                        </div>
                    </div>
                     <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">{isFixedType ? t.fixed_schedule : `${t.startTime} (${t.optional})`}</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} readOnly={isFixedType} className="mt-1 w-full p-2 border border-slate-300 rounded-md read-only:bg-slate-100 read-only:text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">{isFixedType ? ' ' : `${t.endTime} (${t.optional})`}</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} readOnly={isFixedType} className="mt-1 w-full p-2 border border-slate-300 rounded-md read-only:bg-slate-100 read-only:text-slate-500" />
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200">
                     <h4 className="font-semibold text-slate-700 mb-2">{t.assignment}</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1 mt-1 bg-slate-50">
                        {nurses.map(n => <label key={n.id} className="flex items-center p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"><input type="checkbox" checked={nurseIds.includes(n.id)} onChange={() => setNurseIds(p => p.includes(n.id) ? p.filter(id => id !== n.id) : [...p, n.id])} className="mr-3 h-4 w-4 rounded border-gray-300 text-zen-600 focus:ring-zen-500"/>{n.name}</label>)}
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200">
                     <h4 className="font-semibold text-slate-700 mb-2">{t.notes} ({t.optional})</h4>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-md"></textarea>
                </div>
            </form>

            <footer className="p-4 bg-white border-t border-slate-200 flex-shrink-0 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 font-medium">{t.cancel}</button>
                <button type="submit" form="event-form" className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700">{t.confirmEvent}</button>
            </footer>
        </div>
    );
};

const EventTypeSelector: React.FC<{
    onSelect: (type: SpecialStrasbourgEventType) => void;
    onCancel: () => void;
}> = ({ onSelect, onCancel }) => {
    const t = useTranslations();

    const eventTypes: { type: SpecialStrasbourgEventType; label: string; description: string; }[] = [
        { type: 'euroscola', label: t.event_type_euroscola, description: 'Horario fijo 08:00-17:00' },
        { type: 'tuesday_permanence', label: t.event_type_tuesday_permanence, description: 'Horario fijo 13:30-18:30. Solo martes.' },
        { type: 'wednesday_permanence', label: t.event_type_wednesday_permanence, description: 'Horario fijo 09:30-14:30. Solo miércoles.' },
        { type: 'other', label: t.event_type_other, description: 'Nombre y horario personalizables.' },
    ];

    return (
        <div className="p-4">
            <h3 className="font-bold text-lg text-slate-800 mb-4">{t.event_type_selector_title}</h3>
            <div className="space-y-3">
                {eventTypes.map(({ type, label, description }) => (
                    <button
                        key={type}
                        onClick={() => onSelect(type)}
                        className="w-full text-left p-4 bg-white rounded-lg border border-slate-200 hover:bg-zen-50 hover:border-zen-300 transition-all shadow-sm"
                    >
                        <p className="font-semibold text-zen-800">{label}</p>
                        <p className="text-xs text-slate-500 mt-1">{description}</p>
                    </button>
                ))}
            </div>
             <button onClick={onCancel} className="w-full mt-6 text-sm text-center text-slate-600 hover:underline">{t.cancel}</button>
        </div>
    );
};

export const StrasbourgEventsModule: React.FC<StrasbourgEventsModuleProps> = ({ events, nurses, onEventsChange, isAdmin, effectiveUser }) => {
    const t = useTranslations();
    const [view, setView] = useState<'list' | 'selectType' | 'form'>('list');
    const [editingEvent, setEditingEvent] = useState<Partial<SpecialStrasbourgEvent> | null>(null);

    const filteredEvents = useMemo(() => {
        if (isAdmin) return events.sort((a,b) => a.startDate.localeCompare(b.startDate));
        const userId = (effectiveUser as User)?.nurseId ?? effectiveUser?.id;
        return events.filter(e => e.nurseIds.includes(userId || '')).sort((a,b) => a.startDate.localeCompare(b.startDate));
    }, [events, isAdmin, effectiveUser]);
    
    const handleAddNew = () => { setView('selectType'); };
    const handleEdit = (event: SpecialStrasbourgEvent) => { setEditingEvent(event); setView('form'); };
    const handleDelete = (id: string) => { if (window.confirm(t.deleteEventConfirm)) onEventsChange(events.filter(e => e.id !== id)); };
    const handleCancel = () => { setView('list'); setEditingEvent(null); };

    const handleTypeSelected = (type: SpecialStrasbourgEventType) => {
        const newEvent: Partial<SpecialStrasbourgEvent> = { type };
        switch(type) {
            case 'euroscola': newEvent.name = t.event_type_euroscola; newEvent.startTime = '08:00'; newEvent.endTime = '17:00'; break;
            case 'tuesday_permanence': newEvent.name = t.event_type_tuesday_permanence; newEvent.startTime = '13:30'; newEvent.endTime = '18:30'; break;
            case 'wednesday_permanence': newEvent.name = t.event_type_wednesday_permanence; newEvent.startTime = '09:30'; newEvent.endTime = '14:30'; break;
            default: break;
        }
        setEditingEvent(newEvent);
        setView('form');
    };

    const handleSave = (eventData: Omit<SpecialStrasbourgEvent, 'id'> & { id?: string }) => {
        if (eventData.id) { onEventsChange(events.map(e => e.id === eventData.id ? { ...e, ...eventData } as SpecialStrasbourgEvent : e)); } 
        else { onEventsChange([...events, { ...eventData, id: `sevt-${Date.now()}` } as SpecialStrasbourgEvent]); }
        setView('list'); setEditingEvent(null);
    };

    if (view === 'selectType') {
        return <EventTypeSelector onSelect={handleTypeSelected} onCancel={handleCancel} />;
    }
    if (view === 'form' && editingEvent) {
        return <EventForm event={editingEvent} nurses={nurses} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div className="space-y-4 text-sm">
            {isAdmin && <button onClick={handleAddNew} className="w-full px-4 py-2 bg-zen-700 text-white font-semibold rounded-md hover:bg-zen-600">+ {t.createEvent}</button>}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {filteredEvents.length === 0 && <p className="text-slate-500 italic text-center p-4">{t.noEventsToShow}</p>}
                {filteredEvents.map(event => {
                    const assignedNurses = nurses.filter(n => event.nurseIds.includes(n.id)).map(n => n.name).join(', ');
                    const typeKey = `event_type_${event.type}` as keyof Locale;
                    const typeLabel = event.type && event.type !== 'other' && t[typeKey] ? t[typeKey] : null;

                    return (
                        <div key={event.id} className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {typeLabel && <span className="text-xs font-semibold bg-rose-200 text-rose-700 px-1.5 py-0.5 rounded-full">{typeLabel}</span>}
                                    <p className="font-semibold text-rose-800">{event.name}</p>
                                    <p className="text-xs text-rose-600">({event.startDate} to {event.endDate})</p>
                                </div>
                                {isAdmin && <div className="flex gap-2 flex-shrink-0"><button onClick={() => handleEdit(event)} className="p-1 text-blue-600">✏️</button><button onClick={() => handleDelete(event.id)} className="p-1 text-red-600">🗑️</button></div>}
                            </div>
                            <div className="mt-2 text-xs">
                                <p><strong>{t.assignedNurses}:</strong> {assignedNurses}</p>
                                {event.notes && <p className="mt-1 pt-1 border-t border-rose-200/50"><strong>{t.notes}:</strong> {event.notes}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};