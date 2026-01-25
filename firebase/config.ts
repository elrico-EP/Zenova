
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const FIREBASE_CONFIG_KEY = 'zenova-firebase-config';

// FIX: Add missing saveConfigAndReload function used by FirebaseSetupScreen.tsx
export const saveConfigAndReload = (config: any) => {
    try {
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
        window.location.reload();
    } catch (e) {
        console.error("Failed to save config to local storage", e);
        throw new Error("Could not save configuration.");
    }
};


let firebaseConfig;

try {
    const savedConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (savedConfig) {
        firebaseConfig = JSON.parse(savedConfig);
    }
} catch (e) {
    console.error("Failed to load Firebase config from local storage", e);
}

// If no config found in localStorage, use the placeholder.
// This will cause initialization to fail, which is the expected trigger
// for the app to show the setup screen.
if (!firebaseConfig) {
    firebaseConfig = {
     apiKey: "AIzaSyBi3ThoxS4Jvfg84ikUeqK_TISwxgfy2rc",
     authDomain: "zenova-4c728.firebaseapp.com",
     projectId: "zenova-4c728",
     storageBucket: "zenova-4c728.firebasestorage.app",
     messagingSenderId: "1056163871295",
     appId: "1:1056163871295:web:be7dc65ccf20371b21168a"
    };
}

// 2. Inicializar Firebase una sola vez al cargar la app.
// Note: This may throw an error if config is invalid, which is expected to be caught
// by a higher-level component that will then render FirebaseSetupScreen.
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// 3. Exportar las instancias como singletons para ser usadas en toda la app.
export { app, db, auth };
