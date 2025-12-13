import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/axios';
import { AxiosError } from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (!token || !uid) {
      toast({
        title: 'Invalid reset link',
        description: 'The password reset link is invalid or has expired',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/v1/accounts/auth/password-reset/confirm/', {
        token,
        uid,
        new_password: password,
      });

      toast({
        title: 'Password Reset Successful',
        description: 'You can now login with your new password',
      });

      navigate('/auth/login');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: 'Reset Failed',
          description: error.response?.data?.detail || 'Failed to reset password. The link may have expired.',
          variant: 'destructive',
        });
      } else if (error instanceof Error) {
        toast({
          title: 'Reset Failed',
          description: error.message || 'Failed to reset password. The link may have expired.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset Failed',
          description: 'Failed to reset password. The link may have expired.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || password !== confirmPassword}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-primary">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
