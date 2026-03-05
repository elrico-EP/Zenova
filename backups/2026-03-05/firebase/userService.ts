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
    console.log('Authenticating:', username, 'with password check');
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', username.toLowerCase())
        .single();

    if (error || !data) {
        console.log('User not found:', error);
        throw new Error('Usuario o contraseña incorrectos');
    }
    
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
                nurseId: null
            },
            {
                name: 'Viewer',
                email: 'viewer',
                role: 'viewer',
                password: '123456',
                mustChangePassword: false,
                nurseId: null
            }
        ];

        // Add nurses
        INITIAL_NURSES.forEach(nurse => {
            usersToSeed.push({
                name: nurse.name,
                email: nurse.name.toLowerCase().replace(/\s+/g, ''),
                role: 'nurse',
                nurseId: nurse.id,
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
        .insert({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            password: userData.password,
            mustChangePassword: userData.mustChangePassword,
            nurseId: userData.nurseId
        });
    if (error) throw error;
};

export const updateUser = async (userData: User): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            password: userData.password,
            mustChangePassword: userData.mustChangePassword,
            nurseId: userData.nurseId
        })
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
    // Primero verificar la contraseña actual
    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();
    
    if (fetchError) throw new Error('Error verificando usuario');
    if (!user) throw new Error('Usuario no encontrado');
    if (user.password !== currentPassword) throw new Error('Contraseña actual incorrecta');
    
    // Luego actualizar
    const { error } = await supabase
        .from('users')
        .update({ 
            password: newPassword, 
            mustChangePassword: false 
        })
        .eq('id', userId);
        
    if (error) throw error;
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .update({ 
            password: newPassword, 
            mustChangePassword: false 
        })
        .eq('id', userId)
        .select()  // Importante: retornar los datos actualizados
        .single();
        
    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar la contraseña');
    
    return data;
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    return true;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({ 
            password: newPassword, 
            mustChangePassword: false 
        })
        .eq('email', username);
    if (error) throw error;
};