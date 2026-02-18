import type { User, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

const DB_KEY = 'zenova_users_db';

// --- Funciones de persistencia ---
const persistUsers = (users: User[]): void => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Failed to save users to localStorage", e);
    }
};

const getDefaultUsers = (): User[] => [
    { id: 'admin-user', name: 'Admin', email: 'admin', role: 'admin', password: 'admin', mustChangePassword: false },
    { id: 'viewer-user', name: 'Viewer', email: 'viewer', role: 'viewer', password: 'viewer', mustChangePassword: false },
    ...INITIAL_NURSES.map(nurse => ({
        id: nurse.id, name: nurse.name, email: nurse.name.toLowerCase(), role: nurse.role,
        password: '123456', nurseId: nurse.id, mustChangePassword: true,
    }))
];

const initializeUsers = (): User[] => {
    try {
        const storedUsers = localStorage.getItem(DB_KEY);
        if (storedUsers) {
            return JSON.parse(storedUsers);
        }
    } catch (e) {
        console.error("Failed to load users from localStorage, using defaults.", e);
    }
    // Si no hay nada en localStorage, inicializa y guarda los valores por defecto
    const defaultUsers = getDefaultUsers();
    persistUsers(defaultUsers);
    return defaultUsers;
};

// --- Base de datos de usuarios en memoria (cargada desde localStorage) ---
let allUsers: User[] = initializeUsers();
let currentUser: User | null = null;


export const getCurrentUser = async (): Promise<User | null> => {
    return currentUser;
};

export const authenticate = async (username: string, password: string): Promise<User> => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === username.toLowerCase() && u.password === password);
    if (foundUser) {
        currentUser = foundUser;
        return foundUser;
    }
    throw new Error('Usuario o contraseña incorrectos');
};

export const clearCurrentUser = (): void => {
    currentUser = null;
};

export const getUsers = async (): Promise<User[]> => {
    return allUsers.map(({ password, ...user }) => user);
};

export const seedUsersIfEmpty = async (): Promise<void> => {
    // La lógica de inicialización ya se encarga de esto
    return;
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
    const userExists = allUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (userExists) throw new Error('El nombre de usuario ya está en uso.');
    const newUser = { ...userData, id: `user-${Date.now()}` };
    allUsers.push(newUser);
    persistUsers(allUsers);
    return;
};

export const updateUser = async (userData: User): Promise<void> => {
    const userIndex = allUsers.findIndex(u => u.id === userData.id);
    if (userIndex !== -1) {
        const { password, ...rest } = userData;
        allUsers[userIndex] = { ...allUsers[userIndex], ...rest };
        persistUsers(allUsers);
    }
    return;
};

export const deleteUser = async (userId: string): Promise<void> => {
    const userIndex = allUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      allUsers.splice(userIndex, 1);
      persistUsers(allUsers);
    }
    return;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<User> => {
    const user = allUsers.find(u => u.id === userId);
    if (user && user.password === currentPassword) {
        user.password = newPassword;
        user.mustChangePassword = false;
        persistUsers(allUsers);
        if (currentUser?.id === userId) {
            currentUser = user;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userToReturn } = user;
        return userToReturn as User;
    }
    throw new Error('La contraseña actual es incorrecta.');
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<void> => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        user.password = newPassword;
        user.mustChangePassword = false;
        persistUsers(allUsers); // Guardar los cambios
        if (currentUser?.id === userId) {
            currentUser = user; // Actualizar el usuario de la sesión actual
        }
        return;
    }
    throw new Error('Usuario no encontrado.');
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    const userExists = allUsers.some(u => u.email.toLowerCase() === username.toLowerCase());
    if (userExists) {
        console.log(`Solicitud de reseteo de contraseña para ${username}.`);
    }
    return userExists;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
     const user = allUsers.find(u => u.email.toLowerCase() === username.toLowerCase());
    if (user) {
        user.password = newPassword;
        user.mustChangePassword = true;
        persistUsers(allUsers);
        return;
    }
    throw new Error('Usuario no encontrado.');
};