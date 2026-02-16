// Servicio de usuarios temporal (sin Firebase)
import type { User } from '../types';

export const getCurrentUser = async () => {
    return null;
};

export const loginUser = async (username: string, password: string): Promise<User> => {
    // Usuario de prueba
    if (username === 'admin' && password === 'admin') {
        return {
            id: 'user-1',
            name: 'Admin',
            role: 'admin',
            email: 'admin@example.com'
        };
    }
    throw new Error('Usuario o contraseña incorrectos');
};

export const logoutUser = async () => {
    return;
};

export const getAllUsers = async (): Promise<User[]> => {
    return [{
        id: 'user-1',
        name: 'Admin',
        role: 'admin',
        email: 'admin@example.com'
    }];
};

export const registerUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    return {
        id: `user-${Date.now()}`,
        ...userData
    } as User;
};

export const updateUserProfile = async (userData: User): Promise<User> => {
    return userData;
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
    return;
};

export const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    return;
};

export const forcePasswordReset = async (newPassword: string): Promise<void> => {
    return;
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    return true;
};

export const resetUserPassword = async (username: string, newPassword: string): Promise<void> => {
    return;
};
