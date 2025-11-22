import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export function GoogleCallback() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signInWithGoogle, linkWithBackend } = useFirebaseAuth();
    const { setTokensAndFetchProfile, getDashboardRoute } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // This page is typically used after a redirect-based sign-in
                // For popup-based sign-in, the FirebaseLoginButton handles everything
                // If we reach this page, just redirect to login to restart the flow
                navigate('/login', { replace: true });
            } catch (error: any) {
                console.error('OAuth callback error:', error);
                toast({
                    title: 'Authentication Error',
                    description: error.message || 'Failed to complete authentication',
                    variant: 'destructive',
                });
                navigate('/login', { replace: true });
            }
        };

        handleCallback();
    }, [navigate, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}
