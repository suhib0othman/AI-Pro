import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUEV1XmMGgg2TbEml0jXuhlfXYG3NQTSs",
  authDomain: "gen-lang-client-0713858593.firebaseapp.com",
  projectId: "gen-lang-client-0713858593",
  storageBucket: "gen-lang-client-0713858593.firebasestorage.app",
  messagingSenderId: "235983240424",
  appId: "1:235983240424:web:fe50016bc1d34b4bd1dd5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

/**
 * Configure Google OAuth provider for redirect flow
 * prompt: 'consent' forces the consent screen every time (recommended for testing)
 * Remove or set to undefined for production to skip consent screen on repeat visits
 */
googleProvider.setCustomParameters({
  prompt: 'consent',
});

// Scopes for calendar integration
export const calendarScope = "https://www.googleapis.com/auth/calendar.events";

export default app;
