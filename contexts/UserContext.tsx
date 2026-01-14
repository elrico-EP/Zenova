
import React, { useState, createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import type { User, Nurse, UserRole } from '../types';
import * as userService from '../firebase/userService';

interface UserContextType {
  user: User | Nurse | null;
  effectiveUser: User | Nurse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (nurse: Nurse | null) => void;
  isImpersonating: boolean;
  authError: string | null;
  // User management functions
  users: (User | Nurse)[];
  register: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userData: User | Nurse) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | Nurse | null>(null);
  const [impersonatedNurse, setImpersonatedNurse] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState<(User|Nurse)[]>([]);
  
  useEffect(() => {
      const allUsers = userService.getUsers();
      setUsers(allUsers);
      const currentUser = userService.getCurrentUser();
      if (currentUser) {
          setUser(currentUser);
      }
      setIsLoading(false);
  }, []);

  const refreshUsers = () => {
    setUsers(userService.getUsers());
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const loggedInUser = await userService.authenticate(email, password);
      setUser(loggedInUser);
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    userService.clearCurrentUser();
    setUser(null);
    setImpersonatedNurse(null);
  };

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

  const register = async (userData: Omit<User, 'id'>) => {
    if (user?.role !== 'admin') throw new Error("Permission denied");
    await userService.addUser(userData);
    refreshUsers();
  };
  const updateUser = async (userData: User | Nurse) => {
    if (user?.role !== 'admin') throw new Error("Permission denied");
    await userService.updateUser(userData);
    refreshUsers();
  };
  const deleteUser = async (userId: string) => {
    if (user?.role !== 'admin') throw new Error("Permission denied");
    await userService.deleteUser(userId);
    refreshUsers();
  }


  const contextValue = useMemo(() => ({
    user,
    effectiveUser,
    isLoading,
    login,
    logout,
    impersonate,
    isImpersonating,
    authError,
    users,
    register,
    updateUser,
    deleteUser
  }), [user, effectiveUser, isLoading, isImpersonating, authError, users]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
