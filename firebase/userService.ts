
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from './config';
import type { User, Nurse, UserRole } from '../types';
import { INITIAL_NURSES } from '../constants';

// Función para obtener el perfil de la aplicación (con rol) desde Firestore
export const getAppUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        return userDoc.data() as User;
    } else {
        // If user document doesn't exist, create one.
        // Check if this is the very first user in the system.
        const usersCollectionRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);
        const isFirstUser = usersSnapshot.empty;

        const email = firebaseUser.email || '';
        const name = firebaseUser.displayName || email.split('@')[0];
        const associatedNurse = INITIAL_NURSES.find(n => n.email.toLowerCase() === email.toLowerCase());

        let role: UserRole = 'viewer';
        // NEW LOGIC: The first user to ever sign up is automatically an admin.
        if (isFirstUser) {
            role = 'admin';
        } else if (email.toLowerCase().includes('admin')) {
            // Keep the old logic as a fallback for creating other admins later.
            role = 'admin';
        } else if (associatedNurse) {
            role = 'nurse';
        }

        const newUser: User = {
            id: firebaseUser.uid,
            name: associatedNurse?.name || name,
            email,
            role,
            nurseId: associatedNurse?.id
        };

        // Save the new user profile to Firestore
        await setDoc(userDocRef, newUser);
        return newUser;
    }
};

export const signInWithEmail = async (email: string, password: string): Promise<void> => {
    if (!auth) throw new Error("Authentication is not initialized.");
    await signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async (): Promise<void> => {
    if (!auth) throw new Error("Authentication is not initialized.");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
};

export const signOutUser = async (): Promise<void> => {
    if (!auth) throw new Error("Authentication is not initialized.");
    await signOut(auth);
};

export const getAllUsers = async (): Promise<User[]> => {
    if (!db) {
        console.warn("Firestore not initialized, cannot fetch users.");
        return [];
    }
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs.map(doc => doc.data() as User);
};
