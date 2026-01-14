
import type { User, Nurse, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

const USERS_STORAGE_KEY = 'zenova-users-db';
const CURRENT_USER_STORAGE_KEY = 'zenova-current-user-email';

const seedInitialUsers = (): (User | Nurse)[] => {
  const initialUsers: (User|Nurse)[] = [
    { id: 'admin-user', name: 'Admin', email: 'admin@example.com', password: 'admin', role: 'admin' },
    ...INITIAL_NURSES.map(n => ({...n, password: 'password'}))
  ];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  return initialUsers;
};

export const getUsers = (): (User | Nurse)[] => {
  try {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersJson) {
      return seedInitialUsers();
    }
    return JSON.parse(usersJson);
  } catch (e) {
    console.error("Failed to parse users from localStorage", e);
    return seedInitialUsers();
  }
};

const saveUsers = (users: (User | Nurse)[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authenticate = (email: string, password: string): Promise<User | Nurse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.password === password) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.email);
        resolve(user);
      } else {
        reject(new Error('Credenciales incorrectas. Por favor, inténtalo de nuevo.'));
      }
    }, 500);
  });
};

export const getCurrentUser = (): User | Nurse | null => {
    const email = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!email) return null;
    const users = getUsers();
    return users.find(u => u.email === email) || null;
};

export const clearCurrentUser = () => {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
};

export const addUser = (userData: Omit<User, 'id'>): Promise<void> => {
    return new Promise((resolve, reject) => {
        const users = getUsers();
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return reject(new Error('El correo electrónico ya está en uso.'));
        }
        const newUser: User = { ...userData, id: `user-${Date.now()}` };
        saveUsers([...users, newUser]);
        resolve();
    });
};

export const updateUser = (userData: User | Nurse): Promise<void> => {
    return new Promise((resolve, reject) => {
        let users = getUsers();
        const userIndex = users.findIndex(u => u.id === userData.id);
        if (userIndex === -1) {
            return reject(new Error('Usuario no encontrado.'));
        }
        // Preserve password if not provided
        if (!userData.password) {
            userData.password = users[userIndex].password;
        }
        users[userIndex] = userData;
        saveUsers(users);
        resolve();
    });
};

export const deleteUser = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
        let users = getUsers();
        users = users.filter(u => u.id !== userId);
        saveUsers(users);
        resolve();
    });
};
