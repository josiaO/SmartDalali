import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import accountsService from '@/services/accounts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle2, Lock } from 'lucide-react';

export default function Activate() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTokensAndFetchProfile, redirectByRole } = useAuth();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await accountsService.activate(username, code);

      // If the activation endpoint returned tokens, use them to initialize auth
      const access = data?.access || data?.tokens?.access;
      const refresh = data?.refresh || data?.tokens?.refresh;
      if (access && refresh && typeof setTokensAndFetchProfile === 'function') {
        const fetchedUser = await setTokensAndFetchProfile(access, refresh);
        toast({ 
          title: 'Account activated!', 
          description: 'Signed in and redirecting to your dashboard.' 
        });
        if (fetchedUser) {
          redirectByRole(navigate, fetchedUser);
          return;
        }
      }

      toast({ 
        title: 'Account activated', 
        description: 'You can now sign in.' 
      });
      navigate('/login');
    } catch (err: any) {
      toast({ 
        title: 'Activation failed', 
        description: err?.response?.data?.error || 'Invalid code',
        variant: 'destructive'
      });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-primary to-primary/70 p-4 rounded-full shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Activate Account</CardTitle>
          <CardDescription>
            Enter your details to activate your SmartDalali account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter your username"
                  className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Activation Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="Enter the activation code"
                  className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                  required 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Check your email for the activation code
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Activating...
                </span>
              ) : (
                'Activate Account'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Already activated?</span>
              </div>
            </div>

            <Button 
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
