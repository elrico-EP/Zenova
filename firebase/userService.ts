import type { User, Nurse, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

// --- In-Memory Mock Database ---
// This acts as our centralized, "server-side" user store.
// It contains User accounts, which can be linked to Nurse profiles.
let mockUserDatabase: User[] = [
    // Admin User account
    { id: 'admin-user', name: 'Admin', email: 'admin', password: 'admin123', role: 'admin', mustChangePassword: false, passwordResetRequired: false },
    // Create User accounts for each Nurse profile
    ...INITIAL_NURSES.map(nurse => ({
        id: `user-account-${nurse.id}`, // A unique ID for the user account
        name: nurse.name, // The user's name is the same as the nurse's name
        email: nurse.email, // The user's email is the same as the nurse's email
        password: 'password123', // A default password
        role: 'nurse' as UserRole,
        nurseId: nurse.id, // Link this user account to the nurse profile
        mustChangePassword: true, // Force password change on first login
        passwordResetRequired: false,
    }))
];

// --- In-Memory Mock Session ---
let currentUserEmail: string | null = null;


// --- Service Functions ---

// The user management functions now operate on `User` accounts.
// The `Nurse` profiles from `constants.ts` are treated as separate data for the scheduling logic.
export const getUsers = (): User[] => {
  return mockUserDatabase;
};

const saveUsers = (users: User[]) => {
  mockUserDatabase = users;
};

// Note: The return type is `Promise<User>`, not `Promise<User | Nurse>`
export const authenticate = (username: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === username.toLowerCase());

      if (user && user.password === password) {
        currentUserEmail = user.email;
        resolve(user);
      } else {
        reject(new Error('login_error'));
      }
    }, 500);
  });
};

export const getCurrentUser = (): User | null => {
    if (!currentUserEmail) return null;
    const users = getUsers();
    return users.find(u => u.email === currentUserEmail) || null;
};

export const clearCurrentUser = () => {
    currentUserEmail = null;
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

export const changePassword = (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simulate network delay
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
            if (users[userIndex].mustChangePassword) {
              users[userIndex].mustChangePassword = false;
            }
            saveUsers(users);
            resolve();
        }, 500);
    });
};

export const forceSetPassword = (userId: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simulate network delay
            let users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return reject(new Error('userNotFound'));
            }
            
            users[userIndex] = { ...users[userIndex], password: newPassword, mustChangePassword: false, passwordResetRequired: false };
            saveUsers(users);
            
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                 currentUserEmail = currentUser.email;
            }
            
            resolve();
        }, 500);
    });
};

export const requestPasswordReset = (username: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => { // Simulate network delay
            const users = getUsers();
            const userIndex = users.findIndex(u => u.email.toLowerCase() === username.toLowerCase());
            if (userIndex !== -1) {
                const user = users[userIndex];
                if (user.passwordResetRequired) {
                  user.passwordResetRequired = true;
                }
                saveUsers(users);
                resolve(true); // User found
            } else {
                resolve(false); // User not found
            }
        }, 500);
    });
};

export const resetPassword = (username: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simulate network delay
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