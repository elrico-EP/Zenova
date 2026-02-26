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
    
    // Buscar solo por email/username primero (sin comillas, todo minúscula)
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', username)
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
        
        // Insertar admin
        const { error: adminError } = await supabase
            .from('users')
            .insert({
                name: 'Admin',
                email: 'admin',
                role: 'admin',
                password: 'admin123',
                mustchangepassword: false,
                nurseid: null
            });
        
        if (adminError) {
            console.error("Error inserting admin:", adminError.message);
            return;
        }

        // Insertar viewer
        const { error: viewerError } = await supabase
            .from('users')
            .insert({
                name: 'Viewer',
                email: 'viewer',
                role: 'viewer',
                password: '123456',
                mustchangepassword: false,
                nurseid: null
            });
        
        if (viewerError) {
            console.error("Error inserting viewer:", viewerError.message);
            return;
        }

        // Insertar enfermeras
        for (const nurse of INITIAL_NURSES) {
            const { error: nurseError } = await supabase
                .from('users')
                .insert({
                    name: nurse.name,
                    email: nurse.name.toLowerCase().replace(/\s+/g, ''),
                    role: 'nurse',
                    password: '123456',
                    mustchangepassword: true,
                    nurseid: nurse.id
                });
            
            if (nurseError) {
                console.error("Error inserting nurse:", nurse.name, nurseError.message);
            }
        }

        console.log("Default users seeded successfully.");
    } else {
        console.log(`Users table already contains ${count} users. No seing performed.`);
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
            mustchangepassword: userData.mustChangePassword,
            nurseid: userData.nurseid
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
            mustchangepassword: userData.mustChangePassword,
            nurseid: userData.nurseid
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
    const { error } = await supabase
        .from('users')
        .update({ 
            password: newPassword, 
            mustchangepassword: false 
        })
        .eq('id', userId)
        .eq('password', currentPassword);
    if (error) throw error;
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({ 
            password: newPassword, 
            mustchangepassword: false 
        })
        .eq('id', userId);
    if (error) throw error;
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    return true;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({ 
            password: newPassword, 
            mustchangepassword: false 
        })
        .eq('email', username);
    if (error) throw error;
};