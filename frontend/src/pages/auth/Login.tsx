import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { firebaseLogin, getUserRole, login as apiLogin } from '@/api/auth';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

// Background images for the slider
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-e25fa1108638?q=80&w=2075&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626177138729-379e95ce36c9?q=80&w=2072&auto=format&fit=crop",
];

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Background slider effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Clear any existing auth errors when component mounts
  useEffect(() => {
    if (authError) {
      clearError();
    }
  }, []);

  async function handleLoginSuccess(access: string, refresh: string) {
    try {
      // Update context state
      await login(access, refresh);

      // We need to get the user from the updated context, but login is async and updates state.
      // However, the context 'user' might not be updated immediately in this render cycle.
      // But 'login' in AuthContext awaits 'checkAuth' which awaits 'getCurrentUser'.
      // So we can fetch the user directly here for redirection logic, or trust the context will update.
      // To be safe and fast, let's fetch user directly for the role check.

      // Actually, checkAuth sets the user. We can just get it again or return it from login?
      // Let's just fetch it again to be sure we have the role for redirection.
      const { getCurrentUser } = await import('@/api/auth');
      const currentUser = await getCurrentUser();
      const role = getUserRole(currentUser);

      toast.success(t('auth.login_success'));

      const { getDashboardPath } = await import('@/utils/authUtils');
      const params = new URLSearchParams(location.search);
      const redirectPath = params.get('redirect');

      const dashboardPath = redirectPath || getDashboardPath(role);
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('Error during post-login redirect:', error);
      toast.error(t('auth.login_profile_error'));
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Exchange Firebase token for backend JWT
      const { access, refresh } = await firebaseLogin(
        idToken,
        user.email,
        user.displayName,
        user.uid
      );

      await handleLoginSuccess(access, refresh);
    } catch (error: unknown) {
      console.error('Google login error:', error);
      if (error instanceof Error) {
        toast.error(error.message || t('auth.google_login_failed'));
      } else {
        toast.error(t('auth.google_login_failed'));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { access, refresh } = await apiLogin({
        email: formData.email,
        password: formData.password,
      });

      await handleLoginSuccess(access, refresh);
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || error.response?.data?.detail;

        if (error.response?.status === 401) {
          toast.error(errorMessage || t('auth.invalid_credentials'));
        } else if (error.response?.status === 404 || errorMessage?.toLowerCase().includes('not found')) {
          toast.error(t('auth.account_not_found'));
        } else {
          toast.error(errorMessage || t('auth.login_failed'));
        }
      } else if (error instanceof Error) {
        toast.error(error.message || t('auth.login_failed'));
      } else {
        toast.error(t('auth.login_failed'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Background Slider */}
      {BACKGROUND_IMAGES.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 dark:bg-slate-950/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.welcome_back')}</CardTitle>
            <CardDescription className="text-base">
              {t('auth.login_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full py-6 text-foreground"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              {t('auth.google_login')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">
                  {t('auth.or_email')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('form.password')}</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? t('auth.hide_password') : t('auth.show_password')}
                    </span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full py-6 font-semibold" disabled={loading || googleLoading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  t('nav.login')
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">{t('auth.no_account')} </span>
              <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                {t('nav.signup')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
