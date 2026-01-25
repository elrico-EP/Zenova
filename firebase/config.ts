
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, enableNetwork } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// FIX: Add function to save config to local storage and reload page, as required by FirebaseSetupScreen.tsx.
export const saveConfigAndReload = (config: Record<string, string>) => {
  localStorage.setItem('zenova-firebase-config', JSON.stringify(config));
  window.location.reload();
};

const loadConfig = () => {
  try {
    const storedConfig = localStorage.getItem('zenova-firebase-config');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      // Basic validation
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Could not load firebase config from local storage", error);
  }
  
  // Fallback to env vars if nothing in local storage, or placeholder to trigger setup screen.
  return {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSy...REEMPLAZAR_CON_TU_API_KEY",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
};

// Usa env vars (prefijadas con REACT_APP_ en React)
// FIX: Export firebaseConfig and load it dynamically.
export const firebaseConfig = loadConfig();

// The original check is now too strict as it would fail when the setup screen is needed.
// The check is now handled within App.tsx to decide whether to show FirebaseSetupScreen.
// if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
//   throw new Error("Firebase config missing in environment variables. Check Cloudflare Pages settings.");
// }

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  // Only initialize Firebase if a valid config is provided and it's not the placeholder.
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSy...REEMPLAZAR_CON_TU_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // **INICIO DE LA MODIFICACIÓN**
    // Forzar la red para evitar el falso estado "offline"
    (async () => {
      if (db) {
        try {
          await enableNetwork(db);
          console.log("Firestore: network enabled manually");
        } catch (err) {
          console.error("Error enabling Firestore network:", err);
        }
      }
    })();
    // **FIN DE LA MODIFICACIÓN**
  }

} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { app, db, auth };
