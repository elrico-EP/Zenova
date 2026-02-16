
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
  // Cargar usuario guardado al iniciar
// Cargar usuario guardado al iniciar
useEffect(() => {
  const savedUser = localStorage.getItem('zenova_user');
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsLoading(false);
    } catch (e) {
      console.error('Error cargando usuario:', e);
    }
  } else {
    setIsLoading(false); // No hay usuario guardado, mostrar login
  }
}, []);
  
  const [impersonatedNurse, setImpersonatedNurse] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  const refreshUsers = useCallback(async () => {
    try {
        const allUsers = await userService.getUsers();
        setUsers(allUsers);
    } catch (err) {
        console.error("Error refreshing users:", err);
    }
  }, []);

  useEffect(() => {
      const init = async () => {
          try {
              // Intentar sembrar usuarios si la colección está vacía (en segundo plano)
              userService.seedUsersIfEmpty(); 
              
              // Verificar si hay sesión activa
              const currentUser = await userService.getCurrentUser();
              if (currentUser) {
                  setUser(currentUser);
              }
              
              // Cargar lista de usuarios para gestión
              await refreshUsers();
          } catch (error) {
              console.error("Error during UserProvider initialization:", error);
          } finally {
              // ASEGURAR QUE LOADING SEA FALSE para mostrar al menos el login
              setIsLoading(false);
          }
      };
      init();
  }, [refreshUsers]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      console.log('Llamando a authenticate...');
  const loggedInUser = await userService.authenticate(username, password);
     console.log('Respuesta de authenticate:', loggedInUser);
      setUser(loggedInUser);
      localStorage.setItem('zenova_user', JSON.stringify(loggedInUser));
      await refreshUsers();
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUsers]);

  const logout = useCallback(() => {
    userService.clearCurrentUser();
    setUser(null);
    localStorage.removeItem('zenova_user');
    setImpersonatedNurse(null);
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
    await userService.addUser(userData);
    await refreshUsers();
  }, [refreshUsers]);

  const updateUser = useCallback(async (userData: User) => {
    await userService.updateUser(userData);
    await refreshUsers();
  }, [refreshUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    await userService.deleteUser(userId);
    await refreshUsers();
  }, [refreshUsers]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error("No user authenticated");
    await userService.changePassword(user.id, currentPassword, newPassword);
    const updatedUser = await userService.getCurrentUser();
    setUser(updatedUser);
  }, [user]);

  const forceSetPassword = useCallback(async (newPassword: string) => {
    if (!user) throw new Error("No user authenticated");
    await userService.forceSetPassword(user.id, newPassword);
    const updatedUser = await userService.getCurrentUser();
    setUser(updatedUser);
  }, [user]);

  const requestPasswordReset = useCallback(async (username: string): Promise<boolean> => {
      return await userService.requestPasswordReset(username);
  }, []);

  const resetPassword = useCallback(async (username: string, newPassword: string) => {
      await userService.resetPassword(username, newPassword);
  }, []);

  const contextValue = useMemo(() => ({
    user, effectiveUser, isLoading, login, logout, impersonate, isImpersonating, authError,
    users, register, updateUser, deleteUser, changePassword, forceSetPassword,
    requestPasswordReset, resetPassword,
  }), [user, effectiveUser, isLoading, login, logout, impersonate, isImpersonating, authError, users, register, updateUser, deleteUser, changePassword, forceSetPassword, requestPasswordReset, resetPassword]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within UserProvider');
  return context;
};
