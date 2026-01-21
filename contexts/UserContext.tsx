import React, { useState, createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import type { User, Nurse, UserRole } from '../types';
import * as userService from '../firebase/userService';

interface UserContextType {
  user: User | null;
  effectiveUser: User | Nurse | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (nurse: Nurse | null) => void;
  isImpersonating: boolean;
  authError: string | null;
  // User management functions
  users: User[];
  register: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forceSetPassword: (newPassword: string) => Promise<void>;
  requestPasswordReset: (username: string) => Promise<boolean>;
  resetPassword: (username: string, newPassword: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedNurse, setImpersonatedNurse] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
      // On initial load, check for a persistent session in localStorage.
      const currentUser = userService.getCurrentUser();
      if (currentUser) {
          setUser(currentUser);
      }
      const allUsers = userService.getUsers();
      setUsers(allUsers);
      setIsLoading(false);
  }, []);

  const refreshUsers = useCallback(() => {
    setUsers(userService.getUsers());
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const loggedInUser = await userService.authenticate(username, password);
      setUser(loggedInUser);
      refreshUsers(); // Refresh user list in case of changes
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUsers]);

  const logout = useCallback(() => {
    userService.clearCurrentUser();
    setUser(null);
    setImpersonatedNurse(null); // This is crucial to prevent permission bleeding
  }, []);

  const impersonate = useCallback((nurse: Nurse | null) => {
    if (user?.role === 'admin') {
      setImpersonatedNurse(nurse);
    }
  }, [user]);
  
  const effectiveUser = useMemo(() => {
    if (user?.role === 'admin' && impersonatedNurse) {
      return impersonatedNurse;
    }
    if (user?.role === 'nurse') {
        return {
            id: (user as User).nurseId || user.id,
            name: user.name,
            email: user.email,
            role: 'nurse' as UserRole,
            order: 99,
        }
    }
    return user;
  }, [user, impersonatedNurse]);

  const isImpersonating = useMemo(() => user?.role === 'admin' && !!impersonatedNurse, [user, impersonatedNurse]);

  const register = useCallback(async (userData: Omit<User, 'id'>) => {
    if (user?.role !== 'admin') throw new Error("Permission denied");
    await userService.addUser(userData);
    refreshUsers();
  }, [user, refreshUsers]);

  const updateUser = useCallback(async (userData: User) => {
    if (user?.role !== 'admin') throw new Error("Permission denied");
    await userService.updateUser(userData);
    refreshUsers();
  }, [user, refreshUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    if (user?.role !== 'admin') throw new Error("Permission denied");
    await userService.deleteUser(userId);
    refreshUsers();
  }, [user, refreshUsers]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error("No hay un usuario autenticado.");
    await userService.changePassword(user.id, currentPassword, newPassword);
    const updatedUser = userService.getCurrentUser();
    setUser(updatedUser);
    refreshUsers();
  }, [user, refreshUsers]);

  const forceSetPassword = useCallback(async (newPassword: string) => {
    if (!user) throw new Error("No hay un usuario autenticado.");
    await userService.forceSetPassword(user.id, newPassword);
    const updatedUser = userService.getCurrentUser();
    setUser(updatedUser);
  }, [user]);

  const requestPasswordReset = useCallback(async (username: string): Promise<boolean> => {
      return await userService.requestPasswordReset(username);
  }, []);

  const resetPassword = useCallback(async (username: string, newPassword: string) => {
      await userService.resetPassword(username, newPassword);
  }, []);

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
    deleteUser,
    changePassword,
    forceSetPassword,
    requestPasswordReset,
    resetPassword,
  }), [user, effectiveUser, isLoading, login, logout, impersonate, isImpersonating, authError, users, register, updateUser, deleteUser, changePassword, forceSetPassword, requestPasswordReset, resetPassword]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};