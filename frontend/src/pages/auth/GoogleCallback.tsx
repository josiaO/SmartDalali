import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Handle Firebase OAuth callback
    // This would process the Firebase token and exchange it with backend
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      toast({
        title: 'Authentication Failed',
        description: 'Unable to authenticate with Google',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Success case - redirect to dashboard
    toast({
      title: 'Success',
      description: 'Successfully authenticated',
    });
    navigate('/dashboard', { replace: true });
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="ml-4 text-muted-foreground">Completing authentication...</p>
    </div>
  );
}
