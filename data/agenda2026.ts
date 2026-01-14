import type { Agenda } from '../types';

export const agenda2026Data: Agenda = {
    '2026-W02': 'WHITE_GREEN',    // 05/01/2026 - White/Green (Corrected)
    '2026-W03': 'NORMAL',        // 12/01/2026 - Normal
    '2026-W04': 'SESSION',       // 19/01/2026 - Session
    '2026-W05': 'NORMAL',        // 26/01/2026 - Normal
    '2026-W06': 'NORMAL',        // 02/02/2026 - Normal
    '2026-W07': 'SESSION',       // 09/02/2026 - Session
    '2026-W08': 'WHITE_GREEN',   // 16/02/2026 - Green
    '2026-W09': 'NORMAL',        // 23/02/2026 - Normal
    '2026-W10': 'NORMAL',        // 02/03/2026 - Normal
    '2026-W11': 'SESSION',       // 09/03/2026 - Session
    '2026-W12': 'NORMAL',        // 16/03/2026 - Normal
    '2026-W13': 'NORMAL',        // 23/03/2026 - Normal
    '2026-W14': 'WHITE_GREEN',   // 30/03/2026 - Green
    '2026-W15': 'NORMAL',        // 06/04/2026 - Normal
    '2026-W16': 'NORMAL',        // 13/04/2026 - Normal
    '2026-W17': 'NORMAL',        // 20/04/2026 - Normal
    '2026-W18': 'SESSION',       // 27/04/2026 - Session
    '2026-W19': 'NORMAL',        // 04/05/2026 - Normal
    '2026-W20': 'NORMAL',        // 11/05/2026 - Normal
    '2026-W21': 'SESSION',       // 18/05/2026 - Session
    '2026-W22': 'WHITE_GREEN',   // 25/05/2026 - Green
    '2026-W23': 'NORMAL',        // 01/06/2026 - Normal
    '2026-W24': 'NORMAL',        // 08/06/2026 - Normal
    '2026-W25': 'SESSION',       // 15/06/2026 - Session
    '2026-W26': 'NORMAL',        // 22/06/2026 - Normal
    '2026-W27': 'NORMAL',        // 29/06/2026 - Normal
    '2026-W28': 'SESSION',       // 06/07/2026 - Session
    '2026-W29': 'NORMAL',        // 13/07/2026 - Normal
    '2026-W30': 'WHITE_GREEN',   // 20/07/2026 - Green
    '2026-W31': 'REDUCED',       // 27/07/2026 - Reduced
    '2026-W32': 'REDUCED',       // 03/08/2026 - Reduced
    '2026-W33': 'REDUCED',       // 10/08/2026 - Reduced
    '2026-W34': 'REDUCED',       // 17/08/2026 - Reduced
    '2026-W35': 'WHITE_GREEN',   // 24/08/2026 - Green
    '2026-W36': 'NORMAL',        // 31/08/2026 - Normal
    '2026-W37': 'NORMAL',        // 07/09/2026 - Normal
    '2026-W38': 'SESSION',       // 14/09/2026 - Session
    '2026-W39': 'WHITE_GREEN',   // 21/09/2026 - Green
    '2026-W40': 'NORMAL',        // 28/09/2026 - Normal
    '2026-W41': 'SESSION',       // 05/10/2026 - Session
    '2026-W42': 'NORMAL',        // 12/10/2026 - Normal
    '2026-W43': 'SESSION',       // 19/10/2026 - Session
    '2026-W44': 'WHITE_GREEN',   // 26/10/2026 - Green
    '2026-W45': 'NORMAL',        // 02/11/2026 - Normal
    '2026-W46': 'NORMAL',        // 09/11/2026 - Normal
    '2026-W47': 'NORMAL',        // 16/11/2026 - Normal
    '2026-W48': 'SESSION',       // 23/11/2026 - Session
    '2026-W49': 'NORMAL',        // 30/11/2026 - Normal
    '2026-W50': 'NORMAL',        // 07/12/2026 - Normal
    '2026-W51': 'SESSION',       // 14/12/2026 - Session
    '2026-W52': 'WHITE_GREEN',   // 21/12/2026 - Green
    '2026-W53': 'CLOSED',        // 28/12/2026 - Closed
};

export const holidays2026 = new Set([
    '2026-01-01', '2026-01-02', '2026-04-02', '2026-04-03', '2026-04-06',
    '2026-05-01', '2026-05-14', '2026-05-15', '2026-05-25', '2026-07-21',
    '2026-11-02', '2026-12-24', '2026-12-25',
]);

// Note: Nurse names are replaced by IDs for better state management.
// This will be mapped to nurse IDs in the App component.
export const INITIAL_STRASBOURG_ASSIGNMENTS_2026: Record<string, string[]> = {
    '2026-W04': ['nurse-1', 'nurse-4', 'nurse-9', 'nurse-10'],  // Elvio, Paola, Joseph, Tatiana
    '2026-W07': ['nurse-1', 'nurse-2', 'nurse-3', 'nurse-6'],   // Elvio, Tanja, Virginie, Miguel
    '2026-W11': ['nurse-1', 'nurse-9', 'nurse-5', 'nurse-8'],   // Elvio, Joseph, Elena, Katelijn
    '2026-W18': ['nurse-1', 'nurse-6', 'nurse-2', 'nurse-4'],   // Elvio, Miguel, Tanja, Paola
    '2026-W21': ['nurse-1', 'nurse-5', 'nurse-3', 'nurse-7'],   // Elvio, Elena, Virginie, Gorka
    '2026-W25': ['nurse-1', 'nurse-10', 'nurse-7', 'nurse-9'],  // Elvio, Tatiana, Gorka, Joseph
    '2026-W28': ['nurse-1', 'nurse-7', 'nurse-6', 'nurse-5'],   // Elvio, Gorka, Miguel, Elena
    '2026-W38': ['nurse-1', 'nurse-8', 'nurse-5', 'nurse-6'],   // Elvio, Katelijn, Elena, Miguel
    '2026-W41': ['nurse-1', 'nurse-10', 'nurse-4', 'nurse-8'],  // Elvio, Tatiana, Paola, Katelijn
    '2026-W43': ['nurse-1', 'nurse-3', 'nurse-9'],              // Elvio, Virginie, Joseph
    '2026-W48': ['nurse-1', 'nurse-5', 'nurse-7', 'nurse-2'],   // Elvio, Elena, Gorka, Tanja
    '2026-W51': ['nurse-1', 'nurse-9', 'nurse-10', 'nurse-8'],  // Elvio, Joseph, Tatiana, Katelijn
};
