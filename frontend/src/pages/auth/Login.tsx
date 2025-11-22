import { PublicLayout } from '@/layouts/PublicLayout';
import { FirebaseLoginForm } from '@/components/FirebaseLogin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
    const { user, isLoading } = useAuth();

    // Redirect if already logged in
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <PublicLayout>
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-2xl">D</span>
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome to SmartDalali</CardTitle>
                        <CardDescription>
                            Sign in to find your dream property or list your properties as an agent
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FirebaseLoginForm />
                        <div className="text-center text-sm text-muted-foreground">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}
