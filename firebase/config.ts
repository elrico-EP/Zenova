import { initializeApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your app's Firebase project configuration.
// You can get this from the Firebase console for your web app.
const firebaseConfig = {
  apiKey: "AIzaSy...YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with in-memory cache instead of persistent storage.
// This forces an "online-only" mode and prevents the "client is offline"
// error that can occur if the initial connection to the backend fails.
export const db = initializeFirestore(app, { localCache: memoryLocalCache() });

// Export the necessary Firebase services
export const auth = getAuth(app);
