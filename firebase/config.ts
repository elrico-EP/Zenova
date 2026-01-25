
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const FIREBASE_CONFIG_KEY = 'zenova-firebase-config';

// Carga la configuración desde localStorage o devuelve un objeto de ejemplo si no existe.
const loadConfig = () => {
    try {
        const savedConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            if (parsedConfig && parsedConfig.apiKey && parsedConfig.apiKey !== "AIzaSy...REEMPLAZAR_CON_TU_API_KEY") {
                return parsedConfig;
            }
        }
    } catch (e) {
        console.error("Failed to load Firebase config from local storage", e);
    }
    // Devuelve el objeto de ejemplo si no hay nada guardado o si falla la carga.
    return {
      apiKey: "AIzaSy...REEMPLAZAR_CON_TU_API_KEY",
      authDomain: "tu-proyecto-id.firebaseapp.com",
      projectId: "tu-proyecto-id",
      storageBucket: "tu-proyecto-id.appspot.com",
      messagingSenderId: "TU_SENDER_ID",
      appId: "TU_APP_ID"
    };
};

// Exporta la configuración cargada para que App.tsx pueda verificarla.
export const firebaseConfig = loadConfig();

// Exporta la función para guardar la configuración desde la pantalla de setup.
export const saveConfigAndReload = (config: any) => {
    try {
        if (!config || !config.apiKey || !config.projectId) {
            throw new Error("El objeto de configuración proporcionado no es válido.");
        }
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
        window.location.reload();
    } catch (e) {
        console.error("Error al guardar la configuración en localStorage", e);
        throw e; // Re-throw to be caught by the component
    }
};

// Inicializa los servicios de Firebase.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Solo intenta inicializar si la configuración NO es la de ejemplo.
if (firebaseConfig.apiKey !== "AIzaSy...REEMPLAZAR_CON_TU_API_KEY") {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error("Error al inicializar Firebase. La configuración guardada podría ser inválida.", error);
        // Limpia la configuración incorrecta para que la pantalla de setup aparezca en la próxima recarga.
        localStorage.removeItem(FIREBASE_CONFIG_KEY);
    }
} else {
    console.warn("Firebase no está configurado. Se mostrará la pantalla de configuración.");
}

// Exporta las instancias para usarlas en la aplicación. Pueden ser nulas si no está configurado.
export { app, db, auth };
