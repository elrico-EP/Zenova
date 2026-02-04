
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';
import { db } from './config';
import type { User, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

const USERS_COLLECTION = 'users';

export const seedUsersIfEmpty = async () => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (snapshot.empty) {
      console.log("Seeding initial users to Firestore...");
      const initialUsers: User[] = [
        { id: 'admin-user', name: 'Admin', email: 'admin', password: 'admin123', role: 'admin', mustChangePassword: false, passwordResetRequired: false },
        { id: 'viewer-user', name: 'Viewer', email: 'viewer', password: 'viewer123', role: 'viewer', mustChangePassword: false, passwordResetRequired: false },
        ...INITIAL_NURSES.map(nurse => ({
            id: `user-account-${nurse.id}`,
            name: nurse.name,
            email: nurse.name.toLowerCase(), 
            password: '12345', 
            role: 'nurse' as UserRole,
            nurseId: nurse.id,
            mustChangePassword: true,
            passwordResetRequired: false,
        }))
      ];
      for (const u of initialUsers) {
        await setDoc(doc(db, USERS_COLLECTION, u.email.toLowerCase()), u);
      }
    }
  } catch (error) {
    console.warn("No se pudieron sembrar los usuarios (posible restricción de permisos):", error);
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map(d => d.data() as User);
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const authenticate = async (usernameOrEmail: string, password: string): Promise<User> => {
  const inputLower = usernameOrEmail.toLowerCase();
  
  try {
    let userDoc = await getDoc(doc(db, USERS_COLLECTION, inputLower));
    let user = userDoc.exists() ? (userDoc.data() as User) : null;

    if (!user) {
      const q = query(collection(db, USERS_COLLECTION), where("email", "==", inputLower));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        user = querySnapshot.docs[0].data() as User;
      }
    }

    if (user && user.password === password) {
      localStorage.setItem('zenova-current-user-session', user.email);
      return user;
    } else {
      throw new Error('login_error');
    }
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
    const email = localStorage.getItem('zenova-current-user-session');
    if (!email) return null;
    try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, email.toLowerCase()));
        return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};

export const clearCurrentUser = () => {
    localStorage.removeItem('zenova-current-user-session');
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
    const emailLower = userData.email.toLowerCase();
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, emailLower));
    if (userDoc.exists()) {
        throw new Error('usernameInUseError');
    }
    const newUser: User = { 
        ...userData, 
        id: `user-${Date.now()}`, 
        mustChangePassword: true, 
        passwordResetRequired: false 
    };
    await setDoc(doc(db, USERS_COLLECTION, emailLower), newUser);
};

export const updateUser = async (userData: User): Promise<void> => {
    const emailLower = userData.email.toLowerCase();
    const docRef = doc(db, USERS_COLLECTION, emailLower);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
        throw new Error('userNotFound');
    }
    const dataToUpdate = { ...userData };
    if (!dataToUpdate.password) {
        dataToUpdate.password = (existing.data() as User).password;
    }
    await setDoc(docRef, dataToUpdate);
};

export const deleteUser = async (userId: string): Promise<void> => {
    const q = query(collection(db, USERS_COLLECTION), where("id", "==", userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        await deleteDoc(doc(db, USERS_COLLECTION, snapshot.docs[0].id));
    }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const q = query(collection(db, USERS_COLLECTION), where("id", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('userNotFound');
    
    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as User;
    if (user.password !== currentPassword) throw new Error('login_error');

    await updateDoc(userDoc.ref, {
        password: newPassword,
        mustChangePassword: false
    });
};

export const forceSetPassword = async (userId: string, newPassword: string): Promise<void> => {
    const q = query(collection(db, USERS_COLLECTION), where("id", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('userNotFound');
    
    await updateDoc(snapshot.docs[0].ref, {
        password: newPassword,
        mustChangePassword: false,
        passwordResetRequired: false
    });
};

export const requestPasswordReset = async (usernameOrEmail: string): Promise<boolean> => {
    const inputLower = usernameOrEmail.toLowerCase();
    let userDoc = await getDoc(doc(db, USERS_COLLECTION, inputLower));
    
    if (!userDoc.exists()) {
        const q = query(collection(db, USERS_COLLECTION), where("email", "==", inputLower));
        const qs = await getDocs(q);
        if (qs.empty) return false;
        userDoc = qs.docs[0];
    }

    await updateDoc(userDoc.ref, { passwordResetRequired: true });
    return true;
};

export const resetPassword = async (username: string, newPassword: string): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, username.toLowerCase());
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) throw new Error('userNotFound');
    
    await updateDoc(docRef, {
        password: newPassword,
        mustChangePassword: false,
        passwordResetRequired: false
    });
};
