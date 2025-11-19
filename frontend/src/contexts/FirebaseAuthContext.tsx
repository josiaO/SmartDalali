import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  auth, 
  signInWithGoogle, 
  signInWithFacebook,
  handleRedirectResult,
  type FirebaseUser 
} from "@/lib/firebase";
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUserType
} from "firebase/auth";
import accountsService from "@/services/accounts";
import api from "@/lib/api";

interface FirebaseAuthContextType {
  firebaseUser: FirebaseUserType | null;
  isLoading: boolean;
  signInWithGoogle: (useRedirect?: boolean) => Promise<unknown>;
  signInWithFacebook: (useRedirect?: boolean) => Promise<unknown>;
  signOut: () => Promise<void>;
  getFirebaseToken: () => Promise<string | null>;
  linkWithBackend: (firebaseToken: string) => Promise<unknown>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Firebase auth state listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // Check for redirect result (after OAuth redirect)
        await handleRedirectResult();
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setIsLoading(false);
      });
    };

    initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getFirebaseToken = async (): Promise<string | null> => {
    try {
      if (!firebaseUser) {
        console.warn("No Firebase user logged in");
        return null;
      }
      const token = await firebaseUser.getIdToken(true);
      return token;
    } catch (error) {
      console.error("Error getting Firebase token:", error);
      return null;
    }
  };

  // Link Firebase authentication with backend
  const linkWithBackend = async (firebaseToken: string) => {
    try {
      // Send Firebase token to backend to verify and create/update user session
      const response = await api.post("/accounts/firebase-login/", {
        firebase_token: firebaseToken,
        firebase_uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        display_name: firebaseUser?.displayName,
      });

      // Backend should return JWT tokens
      const { access, refresh } = response.data;
      
      if (access && refresh) {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        return response.data;
      }
    } catch (error) {
      console.error("Error linking with backend:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Sign out from backend
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          await accountsService.logout(refreshToken);
        }
      } catch (error) {
        console.warn("Backend logout error:", error);
      }
      
      // Clear tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      delete api.defaults.headers.common["Authorization"];
      
      setFirebaseUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        firebaseUser,
        isLoading,
        signInWithGoogle: (useRedirect) => signInWithGoogle(useRedirect),
        signInWithFacebook: (useRedirect) => signInWithFacebook(useRedirect),
        signOut,
        getFirebaseToken,
        linkWithBackend,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}