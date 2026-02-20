// Servicio de usuarios temporal (sin Firebase)
import type { User } from '../types';

// Usuario de prueba
const TEST_USER: User = {
    id: 'user-1',
    name: 'Admin',
    role: 'admin',
    email: 'admin@example.com'
};

let currentUser: User | null = null;

export const getCurrentUser = async (): Promise<User | null> => {
    return currentUser;
};

export const authenticate = async (username: string, password: string): Promise<User> => {
    console.log('DENTRO de authenticate, recibido:', username, password);
    
    if (username === 'admin' && password === 'admin') {
        console.log('¡Login correcto en authenticate!');
        localStorage.setItem('zenova_user', JSON.stringify(TEST_USER));
        return TEST_USER;
    }
    
    console.log('Login fallido en authenticate');
    throw new Error('Usuario o contraseña incorrectos');
};

export const clearCurrentUser = async (): Promise<void> => {
    currentUser = null;
};

export const getUsers = async (): Promise<User[]> => {
    return [TEST_USER];
};

export const seedUsersIfEmpty = async (): Promise<void> => {
    // No hace nada en modo temporal
    return;
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
    return;
};

export const updateUser = async (userData: User): Promise<void> => {
    return;
};

export const deleteUser = async (userId: string): Promise<void> => {
    return;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    return;
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<void> => {
    return;
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    return true;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
    return;
};