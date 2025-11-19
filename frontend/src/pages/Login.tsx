import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import accountsService from "@/services/accounts";
import { FirebaseLoginForm } from "@/components/FirebaseLogin";

export default function Login() {
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword1, setRegisterPassword1] = useState("");
  const [registerPassword2, setRegisterPassword2] = useState("");
  const [isRegisteringAgent, setIsRegisteringAgent] = useState(false); // New state for agent registration
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const { login, user } = useAuth(); // Removed register from useAuth
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { redirectByRole } = useAuth();



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(loginEmail, loginPassword);

      toast({
        title: "Welcome back!",
        description: `Signed in as ${user.email}. Redirecting to your dashboard...`,
      });

      // Redirect according to role using centralized helper
      redirectByRole(navigate, user);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Login failed. Please try again.";
      setError(errorMsg);
      toast({
        title: "Login failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!registerUsername || !registerEmail || !registerPassword1 || !registerPassword2) {
      setError("All fields are required");
      return;
    }
    
    if (registerPassword1 !== registerPassword2) {
      setError("Passwords do not match");
      return;
    }
    
    if (registerPassword1.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Register the user
      await accountsService.register({
        username: registerUsername,
        email: registerEmail,
        password: registerPassword1,
        is_agent: isRegisteringAgent,
      });

      toast({
        title: "Account created!",
        description: "Your account has been created. Signing you in...",
      });

      // Attempt to login immediately after registration
      const newUser = await login(registerEmail, registerPassword1);

      toast({
        title: "Welcome!",
        description: isRegisteringAgent 
          ? `Welcome to SmartDalali as an Agent! Redirecting to your agent dashboard...`
          : `Welcome to SmartDalali! Redirecting to your dashboard...`,
      });

      // Redirect according to role using centralized helper
      redirectByRole(navigate, newUser);

      // Clear registration form (optional since we've navigated)
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword1("");
      setRegisterPassword2("");
      setIsRegisteringAgent(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || "Registration failed. Please try again.";
      setError(errorMsg);
      toast({
        title: "Registration failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-primary to-primary/70 p-4 rounded-full shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              SmartDalali
            </CardTitle>
            <CardDescription className="text-base">
              Real Estate Made Simple
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="login" className="data-[state=active]:shadow-sm">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:shadow-sm">Create Account</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
                  <AlertDescription className="text-red-900">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 border-border/50 focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 font-semibold shadow-md hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground text-xs font-medium">Or continue with</span>
                  </div>
                </div>

                <FirebaseLoginForm />
              </form>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">{error && (
                <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
                  <AlertDescription className="text-red-900">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerPassword1}
                      onChange={(e) => setRegisterPassword1(e.target.value)}
                      className="pl-10 pr-10 h-11 border-border/50 focus:border-primary transition-colors"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">At least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerPassword2}
                      onChange={(e) => setRegisterPassword2(e.target.value)}
                      className="pl-10 h-11 border-border/50 focus:border-primary transition-colors"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-lg border border-blue-200/50">
                  <Checkbox
                    id="isRegisteringAgent"
                    checked={isRegisteringAgent}
                    onCheckedChange={(checked) => setIsRegisteringAgent(Boolean(checked))}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor="isRegisteringAgent"
                    className="text-sm font-medium text-foreground cursor-pointer flex flex-col"
                  >
                    <span>Register as an Agent</span>
                    <span className="text-xs text-muted-foreground font-normal">List and manage properties</span>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 font-semibold shadow-md hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
