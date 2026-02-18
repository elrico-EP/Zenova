import type { User, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

// --- Base de datos de usuarios en memoria (para simulación) ---
const allUsers: User[] = [
  // 1. Usuario Administrador
  {
    id: 'admin-user',
    name: 'Admin',
    email: 'admin', // Usado como nombre de usuario para iniciar sesión
    role: 'admin',
    password: 'admin',
    mustChangePassword: false,
  },
  // 2. Usuario Observador (Viewer)
  {
    id: 'viewer-user',
    name: 'Viewer',
    email: 'viewer',
    role: 'viewer',
    password: 'viewer',
    mustChangePassword: false,
  },
  // 3. Mapeo de todos los enfermeros/as a usuarios
  ...INITIAL_NURSES.map(nurse => ({
    id: nurse.id, // Reutilizamos el ID de enfermero/a como ID de usuario
    name: nurse.name,
    email: nurse.name.toLowerCase(), // Su email (username) es su nombre en minúsculas
    role: nurse.role,
    password: '123456', // Contraseña temporal
    nurseId: nurse.id, // Vincula la cuenta de usuario con el perfil de enfermero/a
    mustChangePassword: true, // Forzar cambio de contraseña en el primer login
  }))
];

// Variable para simular la sesión activa
let currentUser: User | null = null;

export const getCurrentUser = async (): Promise<User | null> => {
    // En una app real, esto verificaría un token de sesión. Aquí, solo devolvemos el usuario guardado.
    return currentUser;
};

export const authenticate = async (username: string, password: string): Promise<User> => {
    console.log('Intentando autenticar con:', username);
    
    // Buscamos al usuario por email (que usamos como username) y contraseña
    const foundUser = allUsers.find(u => u.email.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (foundUser) {
        console.log('Autenticación exitosa para:', foundUser.name);
        currentUser = foundUser; // Simulamos el inicio de sesión
        return foundUser;
    }
    
    console.log('Autenticación fallida para:', username);
    throw new Error('Usuario o contraseña incorrectos');
};

export const clearCurrentUser = (): void => {
    currentUser = null;
};

export const getUsers = async (): Promise<User[]> => {
    // Devolvemos la lista de usuarios sin la contraseña por seguridad
    return allUsers.map(({ password, ...user }) => user);
};

export const seedUsersIfEmpty = async (): Promise<void> => {
    // En esta simulación, los usuarios ya están "sembrados" en la memoria.
    return;
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
    console.log('Simulando añadir usuario:', userData.name);
    const userExists = allUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (userExists) throw new Error('El nombre de usuario ya está en uso.');
    const newUser = { ...userData, id: `user-${Date.now()}` };
    allUsers.push(newUser);
    return;
};

export const updateUser = async (userData: User): Promise<void> => {
    console.log('Simulando actualizar usuario:', userData.name);
    const userIndex = allUsers.findIndex(u => u.id === userData.id);
    if (userIndex !== -1) {
        // Actualizamos los datos, excepto la contraseña que se maneja por separado
        const { password, ...rest } = userData;
        allUsers[userIndex] = { ...allUsers[userIndex], ...rest };
    }
    return;
};

export const deleteUser = async (userId: string): Promise<void> => {
    console.log('Simulando eliminar usuario:', userId);
    const userIndex = allUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      allUsers.splice(userIndex, 1);
    }
    return;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const user = allUsers.find(u => u.id === userId);
    if (user && user.password === currentPassword) {
        user.password = newPassword;
        console.log('Contraseña cambiada para:', user.name);
        return;
    }
    throw new Error('La contraseña actual es incorrecta.');
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<void> => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        user.password = newPassword;
        user.mustChangePassword = false;
        console.log('Contraseña forzada y actualizada para:', user.name);
        return;
    }
    throw new Error('Usuario no encontrado.');
};

export const requestPasswordReset = async (username: string): Promise<boolean> => {
    const userExists = allUsers.some(u => u.email.toLowerCase() === username.toLowerCase());
    if (userExists) {
        console.log(`Solicitud de reseteo de contraseña para ${username}. En una app real, se enviaría un email.`);
    }
    return userExists;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
     const user = allUsers.find(u => u.email.toLowerCase() === username.toLowerCase());
    if (user) {
        user.password = newPassword;
        user.mustChangePassword = true; // Forzar cambio en el próximo login
        console.log(`Contraseña reseteada para ${username}.`);
        return;
    }
    throw new Error('Usuario no encontrado.');
};