
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const CONFIG_STORAGE_KEY = 'zenova-firebase-config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
    const storedConfigJSON = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (storedConfigJSON) {
        const firebaseConfig = JSON.parse(storedConfigJSON);
        // Validación básica para asegurar que la configuración guardada es utilizable
        if (firebaseConfig.apiKey && firebaseConfig.projectId) {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
        } else {
            console.warn("La configuración de Firebase guardada es inválida. Eliminándola.");
            localStorage.removeItem(CONFIG_STORAGE_KEY);
        }
    }
} catch (error) {
    console.error("Error al inicializar Firebase desde localStorage:", error);
    // Limpiar configuración potencialmente corrupta
    localStorage.removeItem(CONFIG_STORAGE_KEY);
}

// Esta función es llamada por la pantalla de configuración para guardar el objeto
export function saveConfigAndReload(config: object) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error("No se pudo guardar la configuración en localStorage", e);
    // Lanzar un error para mostrar en la UI
    throw new Error("No se pudo guardar la configuración. Por favor, asegúrate de que localStorage esté habilitado y vuelve a intentarlo.");
  }
}

export { db, auth };
