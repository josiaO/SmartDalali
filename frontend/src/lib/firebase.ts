import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { 
  getAuth, 
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAAhLXXBNyMwXHtVXJDAZZvelV1lc0CBo",
  authDomain: "real-estate-4b95b.firebaseapp.com",
  projectId: "real-estate-4b95b",
  storageBucket: "real-estate-4b95b.firebasestorage.app",
  messagingSenderId: "277239496414",
  appId: "1:277239496414:web:dbee05665c3e1b29bf0c4f",
  measurementId: "G-0710ECY4Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (in production)
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Initialize Auth with persistence settings
export const auth: Auth = getAuth(app);

// Set persistence to LOCAL (survives browser restart) by default
// Can be changed to SESSION (cleared on browser close) if needed
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting Firebase auth persistence:", error);
  });

// Initialize Storage
export const storage: FirebaseStorage = getStorage(app);

// Firebase Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Configure providers for production
googleProvider.setCustomParameters({
  prompt: "select_account" // Always show account selection
});

// Export types
export type { FirebaseUser };

// Helper function to sign in with Google
export async function signInWithGoogle(useRedirect: boolean = false): Promise<unknown> {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (useRedirect || isMobile) {
      return signInWithRedirect(auth, googleProvider);
    }
    return signInWithPopup(auth, googleProvider);
  } catch (error: unknown) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

// Helper function to sign in with Facebook
export async function signInWithFacebook(useRedirect: boolean = false): Promise<unknown> {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (useRedirect || isMobile) {
      return signInWithRedirect(auth, facebookProvider);
    }
    return signInWithPopup(auth, facebookProvider);
  } catch (error: unknown) {
    console.error("Facebook sign-in error:", error);
    throw error;
  }
}

// Helper function to handle redirect result after sign-in
export async function handleRedirectResult(): Promise<unknown> {
  try {
    return getRedirectResult(auth);
  } catch (error: unknown) {
    console.error("Redirect result error:", error);
    throw error;
  }
}

export { app, analytics };
