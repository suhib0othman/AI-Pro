import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * ✅ UPDATED: Firebase configuration using environment variables
 * 
 * No hardcoded placeholder values. All sensitive credentials come from environment variables.
 * This keeps secrets out of version control and enables per-environment configuration.
 * 
 * Environment variables should be set in:
 * - Development: .env.local (Git-ignored)
 * - Production: CI/CD secrets or deployment platform environment variables
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// ✅ Validation: Check that Firebase is properly configured
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
  const missing = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missing.length > 0) {
    console.error(
      `❌ [FIREBASE] Missing required environment variables: ${missing.join(', ')}\n` +
      `[FIREBASE] Please set these in your .env.local file:\n` +
      `REACT_APP_FIREBASE_API_KEY\n` +
      `REACT_APP_FIREBASE_AUTH_DOMAIN\n` +
      `REACT_APP_FIREBASE_PROJECT_ID\n` +
      `REACT_APP_FIREBASE_STORAGE_BUCKET\n` +
      `REACT_APP_FIREBASE_MESSAGING_SENDER_ID\n` +
      `REACT_APP_FIREBASE_APP_ID`
    );
    return false;
  }
  console.log('✅ [FIREBASE] Configuration validated successfully');
  return true;
};

if (!validateFirebaseConfig()) {
  console.warn('[FIREBASE] Firebase will not initialize properly without environment variables');
}

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
