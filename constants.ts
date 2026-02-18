import type { Shift, Nurse } from './types';

export const SHIFTS: Record<string, Shift> = {
  // Mapa de colores definitivo según la especificación del usuario.
  'URGENCES': { id: 'URGENCES', label: 'Urg M', description: 'shift_URGENCES_desc', color: 'bg-blue-200', textColor: 'text-blue-800' },
  'TRAVAIL': { id: 'TRAVAIL', label: 'Trav M', description: 'shift_TRAVAIL_desc', color: 'bg-yellow-200', textColor: 'text-yellow-800' },
  'URGENCES_TARDE': { id: 'URGENCES_TARDE', label: 'Urg T', description: 'shift_URGENCES_TARDE_desc', color: 'bg-blue-500', textColor: 'text-blue-50' },
  'TRAVAIL_TARDE': { id: 'TRAVAIL_TARDE', label: 'Trav T', description: 'shift_TRAVAIL_TARDE_desc', color: 'bg-yellow-500', textColor: 'text-yellow-50' },
  'ADMIN': { id: 'ADMIN', label: 'Adm', description: 'shift_ADMIN_desc', color: 'bg-orange-200', textColor: 'text-orange-800' },
  'ADMIN_TARDE': { id: 'ADMIN_TARDE', label: 'Adm T', description: 'shift_ADMIN_TARDE_desc', color: 'bg-orange-500', textColor: 'text-orange-50' },
  'TW': { id: 'TW', label: 'TW', description: 'shift_TW_desc', color: 'bg-purple-300', textColor: 'text-purple-900' },
  'TW_ABROAD': { id: 'TW_ABROAD', label: 'TW Abroad', description: 'shift_TW_ABROAD_desc', color: 'bg-purple-500', textColor: 'text-purple-50' },
  'STRASBOURG': { id: 'STRASBOURG', label: 'STR', description: 'shift_STRASBOURG_desc', color: 'bg-rose-300', textColor: 'text-rose-900' },
  'LIBERO': { id: 'LIBERO', label: 'Libero', description: 'shift_LIBERO_desc', color: 'bg-cyan-200', textColor: 'text-cyan-800' },
  'RECUP': { id: 'RECUP', label: 'Recup', description: 'shift_RECUP_desc', color: 'bg-sky-200', textColor: 'text-sky-800' },
  'FP': { id: 'FP', label: 'FP', description: 'shift_FP_desc', color: 'bg-green-200', textColor: 'text-green-800' },
  'SICK_LEAVE': { id: 'SICK_LEAVE', label: 'Sick', description: 'shift_SICK_LEAVE_desc', color: 'bg-gray-500', textColor: 'text-gray-50' },
  'CA': { id: 'CA', label: 'CA', description: 'shift_CA_desc', color: 'bg-gray-100', textColor: 'text-gray-700' },
  'CS': { id: 'CS', label: 'CS', description: 'shift_CS_desc', color: 'bg-indigo-200', textColor: 'text-indigo-800' },
  'F': { id: 'F', label: 'F', description: 'shift_F_desc', color: 'bg-red-400', textColor: 'text-red-50' }, // Festivo como STR
  'VACCIN': { id: 'VACCIN', label: 'Vac', description: 'shift_VACCIN_desc', color: 'bg-teal-300', textColor: 'text-teal-900' },
  'VACCIN_AM': { id: 'VACCIN_AM', label: 'Vac AM', description: 'shift_VACCIN_AM_desc', color: 'bg-teal-200', textColor: 'text-teal-800' },
  'VACCIN_PM': { id: 'VACCIN_PM', label: 'Vac PM', description: 'shift_VACCIN_PM_desc', color: 'bg-teal-400', textColor: 'text-teal-900' },
  'TRAVAIL_C': { id: 'TRAVAIL_C', label: 'Trav C', description: 'shift_TRAVAIL_desc', color: 'bg-yellow-200', textColor: 'text-yellow-800' },
  'URGENCES_C': { id: 'URGENCES_C', label: 'Urg C', description: 'shift_URGENCES_desc', color: 'bg-blue-200', textColor: 'text-blue-800' },
};

// This is the source of truth for the nursing team structure and order.
// The reconciliation logic in authService ensures Firestore matches this list.
export const INITIAL_NURSES: Nurse[] = [
  { id: 'nurse-1', name: 'Elvio', email: 'elvio', role: 'nurse', order: 0 },
  { id: 'nurse-2', name: 'Tanja', email: 'tanja', role: 'nurse', order: 1 },
  { id: 'nurse-3', name: 'Virginie', email: 'virginie', role: 'nurse', order: 2 },
  { id: 'nurse-4', name: 'Paola', email: 'paola', role: 'nurse', order: 3 },
  { id: 'nurse-5', name: 'Elena', email: 'elena', role: 'nurse', order: 4 },
  { id: 'nurse-6', name: 'Miguel', email: 'miguel', role: 'nurse', order: 5 },
  { id: 'nurse-7', name: 'Gorka', email: 'gorka', role: 'nurse', order: 6 },
  { id: 'nurse-8', name: 'Katelijn', email: 'katelijn', role: 'nurse', order: 7 },
  { id: 'nurse-9', name: 'Joseph', email: 'joseph', role: 'nurse', order: 8 },
  { id: 'nurse-10', name: 'Tatiana', email: 'tatiana', role: 'nurse', order: 9 },
  { id: 'nurse-11', name: 'Becario', email: 'becario', role: 'nurse', order: 10 },
  { id: 'nurse-12', name: 'Ana', email: 'ana', role: 'nurse', order: 11 },
];