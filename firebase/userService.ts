import type { User, Nurse, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

const USERS_STORAGE_KEY = 'zenova-users-db';
const CURRENT_USER_STORAGE_KEY = 'zenova-current-user-session';

const seedInitialUsers = (): User[] => {
  const initialUsers: User[] = [
    { id: 'admin-user', name: 'Admin', email: 'admin', password: 'admin123', role: 'admin', mustChangePassword: false, passwordResetRequired: false },
    ...INITIAL_NURSES.map(nurse => ({
        id: `user-account-${nurse.id}`,
        name: nurse.name,
        email: nurse.name, // Use nurse's name as username
        password: '12345', // Set initial temporary password
        role: 'nurse' as UserRole,
        nurseId: nurse.id,
        mustChangePassword: true, // Force password change on first login
        passwordResetRequired: false,
    }))
  ];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  return initialUsers;
};

export const getUsers = (): User[] => {
  try {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersJson) {
      return seedInitialUsers();
    }
    // FIX: Ensure existing users are correctly mapped before returning.
    const users = JSON.parse(usersJson) as User[];
    const nurseUsersExist = users.some(u => u.role === 'nurse');
    
    // If there are no nurse users, it means we're on an old data structure. Re-seed.
    // Also re-seed if the number of nurse users doesn't match the current team list.
    if (!nurseUsersExist || users.filter(u => u.role === 'nurse').length !== INITIAL_NURSES.length) {
        return seedInitialUsers();
    }
    
    return users;
  } catch (e) {
    console.error("Failed to parse users from localStorage", e);
    return seedInitialUsers();
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authenticate = (username: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === username.toLowerCase());

      if (user && user.password === password) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.email);
        resolve(user);
      } else {
        reject(new Error('login_error'));
      }
    }, 500);
  });
};

export const getCurrentUser = (): User | null => {
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
            return reject(new Error('usernameInUseError'));
        }
        const newUser: User = { 
            ...userData, 
            id: `user-${Date.now()}`, 
            mustChangePassword: true,
            passwordResetRequired: false 
        };
        saveUsers([...users, newUser]);
        resolve();
    });
};

export const updateUser = (userData: User): Promise<void> => {
    return new Promise((resolve, reject) => {
        let users = getUsers();
        const userIndex = users.findIndex(u => u.id === userData.id);
        if (userIndex === -1) {
            return reject(new Error('userNotFound'));
        }
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

export const changePassword = (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return reject(new Error('userNotFound'));
            }
            
            const user = users[userIndex];
            if (user.password !== currentPassword) {
                return reject(new Error('login_error'));
            }

            users[userIndex].password = newPassword;
            users[userIndex].mustChangePassword = false;
            saveUsers(users);
            resolve();
        }, 500);
    });
};

export const forceSetPassword = (userId: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return reject(new Error('userNotFound'));
            }
            
            users[userIndex] = { ...users[userIndex], password: newPassword, mustChangePassword: false, passwordResetRequired: false };
            saveUsers(users);
            
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                 localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUser.email);
            }
            
            resolve();
        }, 500);
    });
};

export const requestPasswordReset = (username: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.email.toLowerCase() === username.toLowerCase());
            if (userIndex !== -1) {
                users[userIndex].passwordResetRequired = true;
                saveUsers(users);
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500);
    });
};

export const resetPassword = (username: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.email.toLowerCase() === username.toLowerCase());
            if (userIndex === -1) {
                return reject(new Error('userNotFound'));
            }
            const user = users[userIndex];
            if (!user.passwordResetRequired) {
                return reject(new Error('passwordResetNotRequested'));
            }
            users[userIndex] = { ...user, password: newPassword, mustChangePassword: false, passwordResetRequired: false };
            saveUsers(users);
            resolve();
        }, 500);
    });
};