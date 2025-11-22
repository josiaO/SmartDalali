import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchMe, type UserProfile } from '@/api/auth';
import { isAuthenticated } from '@/lib/helpers';

interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = async () => {
        if (!isAuthenticated()) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const userData = await fetchMe();
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const refreshUser = async () => {
        setIsLoading(true);
        await loadUser();
    };

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
