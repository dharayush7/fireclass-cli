import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public web config — safe in the browser bundle. Fill from Firebase Console ->
// Project settings -> Your apps -> Web app. Prefer Vite env vars (VITE_*).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
