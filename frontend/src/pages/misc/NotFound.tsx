import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function NotFound() {
    return (
        <PublicLayout>
            <div className="container px-4 md:px-8 max-w-screen-xl mx-auto py-20 text-center">
                <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
                <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Button asChild size="lg">
                    <Link to="/">Go Home</Link>
                </Button>
            </div>
        </PublicLayout>
    );
}
