import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

const FIREBASE_CONFIG_STORAGE_KEY = 'zenova_firebase_config';

const getFirebaseConfigFromStorage = (): FirebaseClientConfig | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as FirebaseClientConfig;
    if (parsed?.apiKey && parsed?.authDomain && parsed?.projectId) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
  }

  return null;
};

const getFirebaseConfigFromEnv = (): FirebaseClientConfig => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

const firebaseConfig = getFirebaseConfigFromStorage() ?? getFirebaseConfigFromEnv();

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error('Firebase config missing. Set VITE_FIREBASE_* env vars or use setup screen to save config.');
}

export const saveConfigAndReload = (config: FirebaseClientConfig) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);