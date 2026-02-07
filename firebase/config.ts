import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBi3ThoxS4Jvfg84ikUeqK_TISwxgfy2rc",
  authDomain: "zenova-4c728.firebaseapp.com",
  projectId: "zenova-4c728",
  storageBucket: "zenova-4c728.firebasestorage.app",
  messagingSenderId: "1056163871295",
  appId: "1:1056163871295:web:be7dc65ccf20371b21168a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);

// Habilitar persistencia (esto resuelve problemas de sincronización)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistencia no disponible (múltiples pestañas abiertas)');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistencia no soportada en este navegador');
  }
});