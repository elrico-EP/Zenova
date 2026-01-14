import React, { useState, useEffect } from 'react';
import type { Nurse, JornadaLaboral, ReductionOption } from '../types';
import { useUser } from '../contexts/UserContext';
import { useTranslations } from '../hooks/useTranslations';

const checkOverlap = (newPeriod: Omit<JornadaLaboral, 'id'>, existingPeriods: JornadaLaboral[], editingId?: string): boolean => {
    const newStart = new Date(newPeriod.fechaInicio);
    const newEnd = newPeriod.fechaFin ? new Date(newPeriod.fechaFin) : new Date('9999-12-31');

    for (const period of existingPeriods) {
        if (editingId && period.id === editingId) continue;

        const start = new Date(period.fechaInicio);
        const end = period.fechaFin ? new Date(period.fechaFin) : new Date('9999-12-31');

        if (newStart <= end && newEnd >= start) {
            return true; // Overlap detected
        }
    }
    return false; // No overlap
};

interface JornadaFormProps {
    nurseId: string;
    jornada: Partial<JornadaLaboral> | null;
    onSave: (jornadaData: Omit<JornadaLaboral, 'id' | 'nurseId'>) => void;
    onCancel: () => void;
    existingJornadas: JornadaLaboral[];
}

const JornadaForm: React.FC<JornadaFormProps> = ({ nurseId, jornada, onSave, onCancel, existingJornadas }) => {
    const t = useTranslations();
    const [porcentaje, setPorcentaje] = useState<80 | 90 | 100>(jornada?.porcentaje || 100);
    const [fechaInicio, setFechaInicio] = useState(jornada?.fechaInicio || new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(jornada?.fechaFin || '');
    const [reductionOption, setReductionOption] = useState<ReductionOption | undefined>(jornada?.reductionOption);
    const [reductionDayOfWeek, setReductionDayOfWeek] = useState<1|2|3|4|5|undefined>(jornada?.reductionDayOfWeek);
    const [secondaryReductionDayOfWeek, setSecondaryReductionDayOfWeek] = useState<1|2|3|4|undefined>(jornada?.secondaryReductionDayOfWeek);
    const [error, setError] = useState('');

    const optionsFor90: { value: ReductionOption; label: string }[] = [
        { value: 'START_SHIFT_4H', label: t.jornada_option_START_SHIFT_4H },
        { value: 'END_SHIFT_4H', label: t.jornada_option_END_SHIFT_4H },
        { value: 'LEAVE_EARLY_1H_L_J', label: t.jornada_option_LEAVE_EARLY_1H_L_J },
    ];
    const optionsFor80: { value: ReductionOption; label: string }[] = [
        { value: 'FULL_DAY_OFF', label: t.jornada_option_FULL_DAY_OFF },
        { value: 'FRIDAY_PLUS_EXTRA', label: t.jornada_option_FRIDAY_PLUS_EXTRA },
    ];
    
    const weekDays = [
        { value: 1, label: t.day_monday }, { value: 2, label: t.day_tuesday },
        { value: 3, label: t.day_wednesday }, { value: 4, label: t.day_thursday },
    ];
     const fridayOption = { value: 5, label: t.day_friday };


    useEffect(() => {
        if (porcentaje === 100) {
            setReductionOption(undefined);
            setReductionDayOfWeek(undefined);
            setSecondaryReductionDayOfWeek(undefined);
        } else if (porcentaje === 90) {
            if (!reductionOption || !optionsFor90.some(o => o.value === reductionOption)) {
                setReductionOption('LEAVE_EARLY_1H_L_J');
            }
             setSecondaryReductionDayOfWeek(undefined);
        } else if (porcentaje === 80) {
             if (!reductionOption || !optionsFor80.some(o => o.value === reductionOption)) {
                setReductionOption('FULL_DAY_OFF');
            }
        }
    }, [porcentaje, reductionOption]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newJornadaData = { 
            porcentaje, fechaInicio, fechaFin: fechaFin || undefined, 
            reductionOption: porcentaje < 100 ? reductionOption : undefined,
            reductionDayOfWeek: porcentaje < 100 ? reductionDayOfWeek : undefined,
            secondaryReductionDayOfWeek: porcentaje < 100 ? secondaryReductionDayOfWeek : undefined,
        };

        if (checkOverlap({ ...newJornadaData, nurseId }, existingJornadas, jornada?.id)) {
            setError(t.jornada_error_overlap);
            return;
        }
        setError('');
        onSave(newJornadaData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-100 rounded-lg space-y-4 my-4 border border-slate-300">
            <h4 className="font-semibold text-slate-700">{jornada?.id ? t.jornada_edit_period : t.jornada_add_period}</h4>
            {error && <p className="text-sm text-red-600 p-2 bg-red-100 rounded-md">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">{t.jornada_startDate}</label><input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required className="w-full p-2 border rounded-md"/></div>
                <div><label className="block text-sm font-medium">{t.jornada_endDate} ({t.optional})</label><input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} min={fechaInicio} className="w-full p-2 border rounded-md"/></div>
            </div>
             <div><label className="block text-sm font-medium">{t.jornada_percentage}</label><select value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value) as 80|90|100)} className="w-full p-2 border rounded-md"><option value={100}>100%</option><option value={90}>90%</option><option value={80}>80%</option></select></div>

            {porcentaje < 100 && (
                <div className="p-3 border-t border-slate-300 mt-4 space-y-4">
                    <h5 className="font-semibold text-gray-800">{t.jornada_reduction_title}</h5>
                    {porcentaje === 90 && (<>
                        <div><label className="block text-sm font-medium">{t.jornada_reduction_option}</label><select value={reductionOption} onChange={e => setReductionOption(e.target.value as ReductionOption)} className="w-full p-2 border rounded-md">{optionsFor90.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        {(reductionOption === 'START_SHIFT_4H' || reductionOption === 'END_SHIFT_4H') && <div><label className="block text-sm font-medium">{t.jornada_select_day}</label><select value={reductionDayOfWeek} onChange={e=>setReductionDayOfWeek(Number(e.target.value) as 1|2|3|4)} required className="w-full p-2 border rounded-md"><option value="">{t.jornada_select_day}...</option>{weekDays.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></div>}
                    </>)}
                     {porcentaje === 80 && (<>
                        <div><label className="block text-sm font-medium">{t.jornada_reduction_option}</label><select value={reductionOption} onChange={e => setReductionOption(e.target.value as ReductionOption)} className="w-full p-2 border rounded-md">{optionsFor80.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        {reductionOption === 'FULL_DAY_OFF' && <div><label className="block text-sm font-medium">{t.jornada_select_day}</label><select value={reductionDayOfWeek} onChange={e=>setReductionDayOfWeek(Number(e.target.value) as 1|2|3|4)} required className="w-full p-2 border rounded-md"><option value="">{t.jornada_select_day}...</option>{weekDays.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></div>}
                        {reductionOption === 'FRIDAY_PLUS_EXTRA' && <div><label className="block text-sm font-medium">{t.jornada_extra_reduction_day}</label><select value={secondaryReductionDayOfWeek} onChange={e=>setSecondaryReductionDayOfWeek(Number(e.target.value) as 1|2|3|4)} required className="w-full p-2 border rounded-md"><option value="">{t.jornada_select_day}...</option>{weekDays.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></div>}
                    </>)}
                </div>
            )}
            <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm bg-white border rounded-md">{t.cancel}</button><button type="submit" className="px-3 py-1.5 text-sm bg-zen-700 text-white rounded-md">{t.save}</button></div>
        </form>
    );
};

export const JornadaLaboralManager: React.FC<{ nurses: Nurse[]; jornadas: JornadaLaboral[]; onClose: () => void; onSave: (jornadas: JornadaLaboral[]) => void; }> = ({ nurses, jornadas, onClose, onSave }) => {
    const t = useTranslations();
    const { user } = useUser();
    const isAdmin = user?.role === 'admin';
    const [jornadasState, setJornadasState] = useState(jornadas);
    const [selectedNurseId, setSelectedNurseId] = useState<string | null>(null);
    const [editingJornada, setEditingJornada] = useState<Partial<JornadaLaboral> | null>(null);

    const handleSaveJornada = (jornadaData: Omit<JornadaLaboral, 'id' | 'nurseId'>) => {
        if (!selectedNurseId) return;
        if (editingJornada?.id) { // Editing existing
            setJornadasState(jornadasState.map(j => j.id === editingJornada!.id ? { ...j, ...jornadaData, nurseId: selectedNurseId } : j));
        } else { // Adding new
            setJornadasState([...jornadasState, { ...jornadaData, nurseId: selectedNurseId, id: `jornada-${Date.now()}` }]);
        }
        setEditingJornada(null);
    };

    const handleDeleteJornada = (id: string) => { if (window.confirm(t.jornada_delete_confirm_message)) setJornadasState(jornadasState.filter(j => j.id !== id)); };
    const handleSaveChanges = () => { onSave(jornadasState); onClose(); };

    const getDayName = (dayOfWeek: number) => {
        const dayMap: Record<number, string> = { 1: t.day_monday, 2: t.day_tuesday, 3: t.day_wednesday, 4: t.day_thursday, 5: t.day_friday };
        return dayMap[dayOfWeek] || '';
    };

    const getRuleDescription = (jornada: JornadaLaboral): string => {
        if (jornada.porcentaje === 100 || !jornada.reductionOption) return 'N/A';
        switch(jornada.reductionOption) {
            case 'FULL_DAY_OFF': return t.jornada_summary_FULL_DAY_OFF.replace('{day}', getDayName(jornada.reductionDayOfWeek!));
            case 'START_SHIFT_4H': return t.jornada_summary_START_SHIFT_4H.replace('{day}', getDayName(jornada.reductionDayOfWeek!));
            case 'END_SHIFT_4H': return t.jornada_summary_END_SHIFT_4H.replace('{day}', getDayName(jornada.reductionDayOfWeek!));
            case 'LEAVE_EARLY_1H_L_J': return t.jornada_summary_LEAVE_EARLY_1H_L_J;
            case 'FRIDAY_PLUS_EXTRA': return t.jornada_summary_FRIDAY_PLUS_EXTRA.replace('{day}', getDayName(jornada.secondaryReductionDayOfWeek!));
            default: return 'N/A';
        }
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-5xl w-full relative transform transition-all flex flex-col h-[90vh]">
        <header className="flex items-center justify-between pb-4 border-b mb-4 flex-shrink-0"><h3 className="text-xl font-bold text-gray-900">{t.jornada_title}</h3><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button></header>
        <main className="flex-grow overflow-y-auto pr-2 text-sm space-y-6">
           <div className="p-4 border rounded-lg bg-slate-50">
               <label htmlFor="nurse-selector" className="block text-sm font-medium text-gray-700">{t.jornada_select_nurse}</label>
               <select id="nurse-selector" value={selectedNurseId || ''} onChange={e => { setSelectedNurseId(e.target.value); setEditingJornada(null); }} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm rounded-md">
                   <option value="" disabled>{t.jornada_select_nurse}</option>
                   {nurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
               </select>
           </div>
           {selectedNurseId && (
               <div>
                    {isAdmin && <button onClick={() => setEditingJornada({})} className="mb-4 px-3 py-1.5 text-sm bg-zen-600 text-white rounded-md hover:bg-zen-700">{t.jornada_add_period}</button>}
                    {editingJornada && <JornadaForm nurseId={selectedNurseId} jornada={editingJornada} onSave={handleSaveJornada} onCancel={() => setEditingJornada(null)} existingJornadas={jornadasState.filter(j => j.nurseId === selectedNurseId)} />}
                    <table className="w-full text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50"><tr><th className="p-2">{t.jornada_startDate}</th><th className="p-2">{t.jornada_endDate}</th><th className="p-2">{t.jornada_percentage}</th><th className="p-2">{t.jornada_description_header}</th>{isAdmin && <th className="p-2 w-20"></th>}</tr></thead>
                        <tbody>
                            {jornadasState.filter(j => j.nurseId === selectedNurseId).sort((a,b) => a.fechaInicio.localeCompare(b.fechaInicio)).map(j => (
                                <tr key={j.id} className="border-b">
                                    <td className="p-2">{j.fechaInicio}</td>
                                    <td className="p-2">{j.fechaFin || 'Indefinido'}</td>
                                    <td className="p-2 font-semibold">{j.porcentaje}%</td>
                                    <td className="p-2">{getRuleDescription(j)}</td>
                                    {isAdmin && <td className="p-2 text-right"><button onClick={() => setEditingJornada(j)} className="p-1 text-blue-600 hover:bg-blue-100 rounded-md">✏️</button><button onClick={() => handleDeleteJornada(j.id)} className="p-1 text-red-600 hover:bg-red-100 rounded-md">🗑️</button></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {jornadasState.filter(j => j.nurseId === selectedNurseId).length === 0 && <p className="p-4 text-center text-slate-500 italic">{t.jornada_no_periods}</p>}
               </div>
           )}
        </main>
        <footer className="pt-4 border-t mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">{t.cancel}</button>
          {isAdmin && <button onClick={handleSaveChanges} className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700">{t.saveChanges}</button>}
        </footer>
      </div>
    </div>
  );
};