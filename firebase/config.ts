import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const CONFIG_KEY = 'zenova-firebase-config';

try {
  const storedConfig = localStorage.getItem(CONFIG_KEY);
  if (storedConfig) {
    const firebaseConfig = JSON.parse(storedConfig);
    // Validación básica para asegurar que el objeto de configuración es válido
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
    } else {
      console.warn("La configuración de Firebase almacenada es inválida. Limpiando...");
      localStorage.removeItem(CONFIG_KEY);
    }
  }
} catch (error) {
  console.error("No se pudo inicializar Firebase desde localStorage:", error);
  localStorage.removeItem(CONFIG_KEY); // Limpiar configuración potencialmente corrupta
}

export function saveConfigAndReload(config: object) {
  try {
    // Validación final antes de guardar
    if (!(config as any).apiKey || !(config as any).projectId) {
        throw new Error("La configuración es inválida.");
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    
    // Da tiempo a la UI para mostrar el mensaje de éxito antes de recargar.
    setTimeout(() => {
        window.location.reload();
    }, 1500);

  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    throw error;
  }
}

export { db, auth };
