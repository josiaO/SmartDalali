import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail } from "lucide-react";

interface FirebaseLoginButtonProps {
  provider: "google" | "facebook";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function FirebaseLoginButton({
  provider,
  variant = "outline",
  size = "default",
  className = "",
  fullWidth = false,
  disabled = false,
}: FirebaseLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithGoogle, signInWithFacebook, linkWithBackend } = useFirebaseAuth();
  const { setTokensAndFetchProfile } = useAuth();

  const handleFirebaseLogin = async () => {
    try {
      setIsLoading(true);

      // Determine if we should use redirect (for mobile) or popup
      const useRedirect = /mobile|android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      let result;
      if (provider === "google") {
        result = await signInWithGoogle(useRedirect);
      } else if (provider === "facebook") {
        result = await signInWithFacebook(useRedirect);
      }

      // If using popup, we have immediate result
      if (result && typeof result === "object" && "user" in result) {
        const firebaseResult = result as { user: { getIdToken: () => Promise<string> } };
        const firebaseToken = await firebaseResult.user.getIdToken();

        // Link with backend
        const backendResponse = (await linkWithBackend(firebaseToken)) as unknown;

        // Initialize user session with backend tokens
        if (
          typeof backendResponse === "object" &&
          backendResponse !== null &&
          "access" in backendResponse &&
          "refresh" in backendResponse
        ) {
          const user = await setTokensAndFetchProfile?.(
            (backendResponse as Record<string, unknown>).access as string,
            (backendResponse as Record<string, unknown>).refresh as string
          );

          toast({
            title: "Success",
            description: `Logged in with ${provider} successfully!`,
          });

          // Navigate to dashboard
          if (user?.role === "agent") {
            navigate("/agent", { replace: true });
          } else if (user?.role === "superuser") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      } else if (useRedirect) {
        // If using redirect, the redirect result will be handled by FirebaseAuthContext
        toast({
          title: "Redirecting",
          description: "Please complete the authentication in the opened window...",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to log in with ${provider}`;
      console.error(`${provider} login error:`, error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const providerConfig = {
    google: {
      label: "Google",
      icon: "🔍",
      bgColor: "bg-white hover:bg-gray-50 border-gray-300",
      textColor: "text-gray-700",
    },
    facebook: {
      label: "Facebook",
      icon: "f",
      bgColor: "bg-blue-600 hover:bg-blue-700",
      textColor: "text-white",
    },
  };

  const config = providerConfig[provider];

  return (
    <Button
      onClick={handleFirebaseLogin}
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      className={`gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <span className="text-base">{config.icon}</span>
      )}
      {isLoading ? "Signing in..." : `Sign in with ${config.label}`}
    </Button>
  );
}

interface FirebaseLoginFormProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: Error) => void;
}

export function FirebaseLoginForm({ onSuccess, onError }: FirebaseLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { firebaseUser, signInWithGoogle, signInWithFacebook, linkWithBackend } = useFirebaseAuth();
  const { setTokensAndFetchProfile } = useAuth();

  const handleLogin = async (provider: "google" | "facebook") => {
    try {
      setIsLoading(true);
      const useRedirect = /mobile|android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      let result;
      if (provider === "google") {
        result = await signInWithGoogle(useRedirect);
      } else {
        result = await signInWithFacebook(useRedirect);
      }

      if (result && typeof result === "object" && "user" in result) {
        const firebaseResult = result as { user: { getIdToken: () => Promise<string> } };
        const firebaseToken = await firebaseResult.user.getIdToken();
        const backendResponse = (await linkWithBackend(firebaseToken)) as unknown;

        if (
          typeof backendResponse === "object" &&
          backendResponse !== null &&
          "access" in backendResponse &&
          "refresh" in backendResponse
        ) {
          const user = await setTokensAndFetchProfile?.(
            (backendResponse as Record<string, unknown>).access as string,
            (backendResponse as Record<string, unknown>).refresh as string
          );

          toast({
            title: "Success",
            description: "Logged in successfully!",
          });

          onSuccess?.(user);
          if (user?.role === "agent") {
            navigate("/agent", { replace: true });
          } else if (user?.role === "superuser") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      console.error("Login error:", error);
      const err = new Error(errorMessage);
      onError?.(err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <FirebaseLoginButton
        provider="google"
        fullWidth
        disabled={isLoading}
      />
      <FirebaseLoginButton
        provider="facebook"
        fullWidth
        disabled={isLoading}
      />
    </div>
  );
}
