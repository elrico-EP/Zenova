import React, { useState, createContext, useContext, useMemo, useCallback } from 'react';
import type { User, Nurse } from '../types';

interface UserContextType {
  user: User | null;
  effectiveUser: User | Nurse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>; // Mock
  logout: () => Promise<void>; // Mock
  impersonate: (nurse: Nurse | null) => void;
  isImpersonating: boolean;
  authError: string | null;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

const mockAdminUser: User = {
    id: 'admin-user',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin'
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User | null>(mockAdminUser); // Always logged in as admin
  const [impersonatedNurse, setImpersonatedNurse] = useState<Nurse | null>(null);

  const impersonate = useCallback((nurse: Nurse | null) => {
    if (user?.role === 'admin') {
      setImpersonatedNurse(nurse);
    }
  }, [user]);
  
  const effectiveUser = useMemo(() => {
    if (user?.role === 'admin' && impersonatedNurse) {
      return impersonatedNurse;
    }
    return user;
  }, [user, impersonatedNurse]);

  const isImpersonating = useMemo(() => user?.role === 'admin' && !!impersonatedNurse, [user, impersonatedNurse]);

  // Mock functions to satisfy the interface
  const login = async () => Promise.resolve();
  const logout = async () => Promise.resolve();

  const contextValue = useMemo(() => ({
    user,
    effectiveUser,
    isLoading: false, // Never loading
    login,
    logout,
    impersonate,
    isImpersonating,
    authError: null
  }), [user, effectiveUser, impersonate, isImpersonating]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};