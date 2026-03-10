import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Nurse } from '../types';
import { INITIAL_NURSES } from '../constants';

interface NurseContextType {
  nurses: Nurse[];
  setMonth: (month: number) => void;
}

const NurseContext = createContext<NurseContextType | undefined>(undefined);

export const NurseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [month, setMonth] = useState(new Date().getMonth());

  const nurses = useMemo(() => {
    if (month >= 2) { // March is month 2 (0-indexed)
      return INITIAL_NURSES.filter(n => n.id !== 'nurse-11');
    }
    return INITIAL_NURSES;
  }, [month]);

  return (
    <NurseContext.Provider value={{ nurses, setMonth }}>
      {children}
    </NurseContext.Provider>
  );
};

export const useNurses = () => {
  const context = useContext(NurseContext);
  if (!context) {
    throw new Error('useNurses must be used within a NurseProvider');
  }
  return context;
};
