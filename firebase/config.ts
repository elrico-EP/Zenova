
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Esta función se mantiene solo para evitar errores de compilación en un archivo no utilizado (FirebaseSetupScreen.tsx).
// No tiene ningún efecto en la aplicación.
export const saveConfigAndReload = (config: any) => {
    console.warn("saveConfigAndReload is deprecated and has no effect.");
};

// ====================================================================================
// IMPORTANTE: Reemplaza estos valores de ejemplo con la configuración real de tu proyecto de Firebase.
// Puedes encontrarla en tu Consola de Firebase > Configuración del proyecto > Tus apps > Configuración.
// ====================================================================================
const firebaseConfig = {
  apiKey: "AIzaSy...REEMPLAZAR_CON_TU_API_KEY",
  authDomain: "tu-proyecto-id.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto-id.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};


// Inicializar Firebase una sola vez.
// Si la configuración de arriba no es válida, la app fallará aquí.
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Error al inicializar Firebase. ¿Has reemplazado la configuración de ejemplo en firebase/config.ts?", error);
    // Para que la app no crashee del todo, asignamos valores nulos.
    // La pantalla de login mostrará errores, pero la app no se romperá.
    app = null!;
    auth = null!;
    db = null!;
}


// Exportar las instancias para ser usadas en toda la app.
export { app, db, auth };
