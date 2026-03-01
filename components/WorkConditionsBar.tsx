import React, { useMemo } from 'react';
import type { Nurse, JornadaLaboral } from '../types';
import { getActiveJornada } from '../utils/jornadaUtils';
import { useTranslations } from '../hooks/useTranslations';

interface WorkConditionsBarProps {
    nurses: Nurse[];
    jornadas: JornadaLaboral[];
    currentDate: Date;
    compact?: boolean;
}

export const WorkConditionsBar: React.FC<WorkConditionsBarProps> = ({ nurses, jornadas, currentDate, compact = false }) => {
    const t = useTranslations();

    const activeReductions = useMemo(() => {
        return nurses
            .map(nurse => {
                const activeJornada = getActiveJornada(nurse.id, currentDate, jornadas);
                if (activeJornada && activeJornada.porcentaje < 100) {
                    const startDate = new Date(activeJornada.fechaInicio);
                    const formattedDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'numeric' }).format(startDate);
                    return {
                        name: nurse.name,
                        porcentaje: activeJornada.porcentaje,
                        fecha: formattedDate,
                    };
                }
                return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [nurses, jornadas, currentDate]);

    if (activeReductions.length === 0) {
        return null;
    }

    return (
        <div className={`p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 ${compact ? 'text-xs' : 'text-sm mb-4'}`}>
            <h4 className={`font-semibold mb-2 ${compact ? 'text-xs' : ''}`}>{t.activeWorkConditions}</h4>
            <ul className={`${compact ? 'space-y-1' : 'flex flex-wrap gap-x-6 gap-y-1'} list-none`}>
                {activeReductions.map(item => (
                    <li key={item.name} className={compact ? '' : 'list-disc list-inside'}>
                        {compact ? (
                            <div>
                                <div className="font-bold text-[10px]">{item.name}</div>
                                <div className="text-[9px]">{t.reduction} {item.porcentaje}%</div>
                            </div>
                        ) : (
                            <><strong>{item.name}</strong> &rarr; {t.reduction} {item.porcentaje}%</>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};