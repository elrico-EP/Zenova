import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your app's Firebase project configuration.
// You can get this from the Firebase console for your web app.
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

// Export the necessary Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
