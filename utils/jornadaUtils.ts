import type { JornadaLaboral, Nurse } from '../types';

/**
 * Finds the active work schedule (JornadaLaboral) for a given nurse on a specific date.
 * @param nurseId - The ID of the nurse.
 * @param date - The date to check for.
 * @param jornadas - An array of all JornadaLaboral periods.
 * @returns The active JornadaLaboral object or null if none is found.
 */
export const getActiveJornada = (
  nurseId: string,
  date: Date,
  jornadas: JornadaLaboral[]
): JornadaLaboral | null => {
  const nurseJornadas = jornadas
    .filter(j => j.nurseId === nurseId)
    .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0); // Normalize date to avoid time issues

  for (const jornada of nurseJornadas) {
    const startDate = new Date(jornada.fechaInicio);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = jornada.fechaFin ? new Date(jornada.fechaFin) : new Date('9999-12-31');
    endDate.setHours(23, 59, 59, 999);

    if (checkDate >= startDate && checkDate <= endDate) {
      return jornada;
    }
  }

  return null;
};