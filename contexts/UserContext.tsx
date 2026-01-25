
import React, { useState, createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import type { User, Nurse, UserRole } from '../types';
import * as authService from '../firebase/userService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';

interface UserContextType {
  user: User | null;
  effectiveUser: User | Nurse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  impersonate: (nurse: Nurse | null) => void;
  isImpersonating: boolean;
  authError: string | null;
  // User management functions (ahora usan Firebase)
  register: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forceSetPassword: (newPassword: string) => Promise<void>;
  // Mantengo las funciones de `localStorage` para compatibilidad, aunque no se usen
  requestPasswordReset: (username: string) => Promise<boolean>;
  resetPassword: (username: string, newPassword: string) => Promise<void>;
  users: User[];
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedNurse, setImpersonatedNurse] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]); // Sigue siendo útil para la UI de gestión

  useEffect(() => {
    if (!auth) {
        console.warn("Firebase Auth no está inicializado. Saltando la comprobación de autenticación.");
        setIsLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          const appUser = await authService.getAppUser(firebaseUser);
          setUser(appUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error crítico al obtener el perfil de usuario durante el chequeo de autenticación:", error);
        // Si hay un usuario de Firebase pero no podemos obtener su perfil de la BD,
        // es un estado inválido. Forzamos el cierre de sesión para evitar un bucle.
        await authService.signOutUser();
        setUser(null);
        setAuthError("No se pudo cargar tu perfil. Por favor, inicia sesión de nuevo.");
      } finally {
        // Aseguramos que el estado de carga siempre termine.
        setIsLoading(false);
      }
    });

    // Cargar la lista de usuarios para la gestión (puede hacerse en paralelo)
    authService.getAllUsers().then(setUsers).catch(err => console.error("No se pudo cargar la lista de usuarios:", err));

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await authService.signInWithEmail(email, password);
      // onAuthStateChanged se encargará de actualizar el estado del usuario
    } catch (error) {
      console.error("Error en el inicio de sesión con email:", error);
      setAuthError((error as Error).message || "Credenciales incorrectas.");
      setIsLoading(false); // Detener la carga solo si hay error
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await authService.signInWithGoogle();
      // onAuthStateChanged se encargará de actualizar el estado del usuario
    } catch (error) {
      console.error("Error en el inicio de sesión con Google:", error);
      setAuthError((error as Error).message || "No se pudo iniciar sesión con Google.");
      setIsLoading(false); // Detener la carga solo si hay error
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.signOutUser();
    setUser(null);
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
            id: (user as User).nurseId || user.id, name: user.name, email: user.email,
            role: 'nurse' as UserRole, order: 99,
        }
    }
    return user;
  }, [user, impersonatedNurse]);

  const isImpersonating = useMemo(() => user?.role === 'admin' && !!impersonatedNurse, [user, impersonatedNurse]);

  // Aquí las funciones de gestión de usuarios llamarían a Firebase Functions en un futuro.
  // Por ahora, las mantenemos apuntando a la simulación para no romper la UI.
  const register = async (userData: Omit<User, 'id'>) => { /* TODO: Implement with Firebase Functions */ };
  const updateUser = async (userData: User) => { /* TODO: Implement with Firebase Functions */ };
  const deleteUser = async (userId: string) => { /* TODO: Implement with Firebase Functions */ };
  const changePassword = async (current:string, newP: string) => { /* TODO: Implement re-authentication */ };
  const forceSetPassword = async (newP: string) => { /* TODO: Implement with Firebase Functions */ };
  const requestPasswordReset = async (username: string) => { return false; };
  const resetPassword = async (u:string, p:string) => {};


  const contextValue = useMemo(() => ({
    user, effectiveUser, isLoading, login, signInWithGoogle, logout, impersonate, isImpersonating, authError,
    users, register, updateUser, deleteUser, changePassword, forceSetPassword,
    requestPasswordReset, resetPassword,
  }), [user, effectiveUser, isLoading, authError, users, login, signInWithGoogle, logout, impersonate, isImpersonating]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
