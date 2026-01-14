
import React, { useState, useMemo } from 'react';
import type { Nurse, SpecialStrasbourgEvent, User } from '../types';

interface StrasbourgEventsModuleProps {
    events: SpecialStrasbourgEvent[];
    nurses: Nurse[];
    onEventsChange: (events: SpecialStrasbourgEvent[]) => void;
    isAdmin: boolean;
    effectiveUser: User | Nurse | null;
}

const EventForm: React.FC<{
    event: Partial<SpecialStrasbourgEvent> | null;
    nurses: Nurse[];
    onSave: (event: Omit<SpecialStrasbourgEvent, 'id'> & { id?: string }) => void;
    onCancel: () => void;
}> = ({ event, nurses, onSave, onCancel }) => {
    const [name, setName] = useState(event?.name || '');
    const [startDate, setStartDate] = useState(event?.startDate || '');
    const [endDate, setEndDate] = useState(event?.endDate || '');
    const [startTime, setStartTime] = useState(event?.startTime || '');
    const [endTime, setEndTime] = useState(event?.endTime || '');
    const [nurseIds, setNurseIds] = useState(event?.nurseIds || []);
    const [notes, setNotes] = useState(event?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: event?.id, name, startDate, endDate, startTime, endTime, nurseIds, notes });
    };

    return (
        <div className="flex flex-col bg-slate-50 max-h-[80vh]">
            {/* Header */}
            <header className="p-4 border-b border-slate-200 bg-white flex-shrink-0 flex items-center gap-4">
                 <button onClick={onCancel} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h3 className="font-bold text-lg text-slate-800">{event?.id ? 'Editar Evento' : 'Crear Evento'}</h3>
            </header>

            {/* Form Content */}
            <form id="event-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-4 space-y-4 text-sm">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-2">Información del Evento</h4>
                    <div>
                        <label className="block font-medium text-slate-600">Nombre del evento</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">Fecha Inicio</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">Fecha Fin</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" min={startDate} />
                        </div>
                    </div>
                     <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">Hora Inicio (opcional)</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div className="flex-1 min-w-36">
                            <label className="block font-medium text-slate-600">Hora Fin (opcional)</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200">
                     <h4 className="font-semibold text-slate-700 mb-2">Asignación</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1 mt-1 bg-slate-50">
                        {nurses.map(n => <label key={n.id} className="flex items-center p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"><input type="checkbox" checked={nurseIds.includes(n.id)} onChange={() => setNurseIds(p => p.includes(n.id) ? p.filter(id => id !== n.id) : [...p, n.id])} className="mr-3 h-4 w-4 rounded border-gray-300 text-zen-600 focus:ring-zen-500"/>{n.name}</label>)}
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200">
                     <h4 className="font-semibold text-slate-700 mb-2">Notas (opcional)</h4>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-md"></textarea>
                </div>
            </form>

            {/* Footer Actions */}
            <footer className="p-4 bg-white border-t border-slate-200 flex-shrink-0 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 font-medium">Cancelar</button>
                <button type="submit" form="event-form" className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700">Confirmar Evento</button>
            </footer>
        </div>
    );
};

export const StrasbourgEventsModule: React.FC<StrasbourgEventsModuleProps> = ({ events, nurses, onEventsChange, isAdmin, effectiveUser }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingEvent, setEditingEvent] = useState<Partial<SpecialStrasbourgEvent> | null>(null);

    const filteredEvents = useMemo(() => {
        if (isAdmin) return events.sort((a,b) => a.startDate.localeCompare(b.startDate));
        return events.filter(e => e.nurseIds.includes(effectiveUser?.id || '')).sort((a,b) => a.startDate.localeCompare(b.startDate));
    }, [events, isAdmin, effectiveUser]);

    const handleAddNew = () => { setEditingEvent({}); setView('form'); };
    const handleEdit = (event: SpecialStrasbourgEvent) => { setEditingEvent(event); setView('form'); };
    const handleDelete = (id: string) => { if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) onEventsChange(events.filter(e => e.id !== id)); };

    const handleSave = (eventData: Omit<SpecialStrasbourgEvent, 'id'> & { id?: string }) => {
        if (eventData.id) { // Edit
            onEventsChange(events.map(e => e.id === eventData.id ? { ...e, ...eventData } : e));
        } else { // Create
            onEventsChange([...events, { ...eventData, id: `sevt-${Date.now()}` }]);
        }
        setView('list');
        setEditingEvent(null);
    };
    
    const handleCancel = () => {
        setView('list');
        setEditingEvent(null);
    }

    if (view === 'form') {
        return <EventForm event={editingEvent} nurses={nurses} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div className="space-y-4 text-sm">
            {isAdmin && <button onClick={handleAddNew} className="w-full px-4 py-2 bg-zen-700 text-white font-semibold rounded-md hover:bg-zen-600">+ Crear Evento</button>}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {filteredEvents.length === 0 && <p className="text-slate-500 italic text-center p-4">No hay eventos para mostrar.</p>}
                {filteredEvents.map(event => {
                    const assignedNurses = nurses.filter(n => event.nurseIds.includes(n.id)).map(n => n.name).join(', ');
                    return (
                        <div key={event.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-purple-800">{event.name}</p>
                                    <p className="text-xs text-purple-600">{event.startDate} al {event.endDate}</p>
                                </div>
                                {isAdmin && <div className="flex gap-2"><button onClick={() => handleEdit(event)} className="p-1 text-blue-600">✏️</button><button onClick={() => handleDelete(event.id)} className="p-1 text-red-600">🗑️</button></div>}
                            </div>
                            <div className="mt-2 text-xs">
                                <p><strong>Asignados:</strong> {assignedNurses}</p>
                                {event.notes && <p className="mt-1 pt-1 border-t border-purple-200/50"><strong>Notas:</strong> {event.notes}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
