import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface FirebaseAuthContextType {
    user: User | null;
    loading: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <FirebaseAuthContext.Provider value={{ user, loading }}>
            {children}
        </FirebaseAuthContext.Provider>
    );
}

export function useFirebaseAuth() {
    const context = useContext(FirebaseAuthContext);
    if (context === undefined) {
        throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
    }
    return context;
}
