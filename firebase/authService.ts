
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';
import type { User, Nurse } from '../types';
import { INITIAL_NURSES } from '../constants';

// Simple mapping from email to nurse profile for the demo
const findNurseByEmail = (email: string): Nurse | undefined => {
  return INITIAL_NURSES.find(n => n.email.toLowerCase() === email.toLowerCase());
};

export const handleSignIn = (email: string, password: string): Promise<User | Nurse> => {
  return signInWithEmailAndPassword(auth, email, password).then(userCredential => {
    const firebaseUser = userCredential.user;
    if (firebaseUser.email?.toLowerCase().includes('admin')) {
      return {
        id: firebaseUser.uid,
        name: 'Admin',
        email: firebaseUser.email!,
        role: 'admin',
      };
    }
    const nurseProfile = findNurseByEmail(firebaseUser.email!);
    if (nurseProfile) {
      return nurseProfile;
    }
    // Fallback for unknown nurse email
    return {
      id: firebaseUser.uid,
      name: firebaseUser.email!.split('@')[0],
      email: firebaseUser.email!,
      role: 'nurse',
      order: 99,
    } as Nurse;
  });
};

export const handleSignOut = (): Promise<void> => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | Nurse | null) => void): (() => void) => {
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    if (firebaseUser.email?.toLowerCase().includes('admin')) {
      callback({
        id: firebaseUser.uid,
        name: 'Admin',
        email: firebaseUser.email!,
        role: 'admin',
      });
      return;
    }

    const nurseProfile = findNurseByEmail(firebaseUser.email!);
    if (nurseProfile) {
      callback(nurseProfile);
    } else {
       callback({
          id: firebaseUser.uid,
          name: firebaseUser.email!.split('@')[0],
          email: firebaseUser.email!,
          role: 'nurse',
          order: 99,
       } as Nurse);
    }
  });
};