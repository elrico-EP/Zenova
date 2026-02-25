// Servicio de usuarios con Supabase
import { supabase } from './supabase-config';
import type { User, Nurse } from '../types';
import { INITIAL_NURSES } from '../constants';

export const getCurrentUser = async (): Promise<User | null> => {
    const savedUser = localStorage.getItem('zenova_user');
    if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const authenticate = async (username: string, password: string): Promise<User> => {
    console.log('Authenticating:', username);
    
    // Buscar solo por email primero
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', username.toLowerCase())
        .single();

    if (error || !data) {
        console.log('User not found:', error);
        throw new Error('Usuario o contraseña incorrectos');
    }
    
    // Verificar contraseña manualmente
    if (data.password !== password) {
        console.log('Password mismatch, expected:', data.password, 'got:', password);
        throw new Error('Usuario o contraseña incorrectos');
    }
    
    console.log('Login successful for:', data.name);
    const user: User = data;
    localStorage.setItem('zenova_user', JSON.stringify(user));
    return user;
};
export const clearCurrentUser = async (): Promise<void> => {
    localStorage.removeItem('zenova_user');
};

export const getUsers = async (): Promise<User[]> => {
    console.log("Fetching all users from Supabase...");
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
    
    if (error) {
        console.error("Supabase error fetching users:", error.message);
        return [];
    }
    console.log("Users fetched successfully:", data);
    return data || [];
};

export const seedUsersIfEmpty = async (): Promise<void> => {
    console.log("Attempting to seed users if empty...");
    const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

    if (error) {
        console.error("Supabase error checking users count:", error.message);
        return;
    }

    if (count === 0) {
        console.log("Users table is empty. Seeding default users...");
        const usersToSeed: Omit<User, 'id'>[] = [
            {
                name: 'Admin',
                email: 'admin',
                role: 'admin',
                password: 'admin123',
                mustChangePassword: false,
                nurseid: null // Admin doesn't have a nurseId
            },
            {
                name: 'Viewer',
                email: 'viewer',
                role: 'viewer',
                password: '123456',
                mustChangePassword: false,
                nurseid: null // Viewer doesn't have a nurseId
            }
        ];

        // Add nurses
        INITIAL_NURSES.forEach(nurse => {
            usersToSeed.push({
                name: nurse.name,
                email: nurse.name.toLowerCase(), // Use lowercase name as email/username
                role: 'nurse',
                nurseid: nurse.id,
                password: '123456',
                mustChangePassword: true
            });
        });

        const { error: seedError } = await supabase
            .from('users')
            .insert(usersToSeed);

        if (seedError) {
            console.error("Supabase error seeding users:", seedError.message);
        } else {
            console.log("Default users seeded successfully.");
        }
    } else {
        console.log(`Users table already contains ${count} users. No seeding performed.`);
    }
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .insert([userData]);
    if (error) throw error;
};

export const updateUser = async (userData: User): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userData.id);
    if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    if (error) throw error;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword, mustChangePassword: false })
        .eq('id', userId)
        .eq('password', currentPassword);
    if (error) throw error;
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword, mustChangePassword: false })
        .eq('id', userId);
    if (error) throw error;
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    return true;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword, mustChangePassword: false })
        .eq('email', username);
    if (error) throw error;
};
