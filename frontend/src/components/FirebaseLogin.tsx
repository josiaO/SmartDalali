import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface FirebaseLoginButtonProps {
  provider: "google" | "facebook";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * Small helper that extracts device capability.
 */
const isMobileDevice = () =>
  /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Shared provider metadata
 */
const PROVIDER_META = {
  google: {
    label: "Google",
    icon: "G",
  },
  facebook: {
    label: "Facebook",
    icon: "f",
  },
} as const;

/**
 * Handles all Firebase → Backend → Profile logic.
 */
async function completeAuthFlow({
  provider,
  signInWithGoogle,
  signInWithFacebook,
  linkWithBackend,
  setTokensAndFetchProfile,
  navigate,
  toast,
}: any) {
  const useRedirect = isMobileDevice();

  // Trigger provider sign-in
  const result =
    provider === "google"
      ? await signInWithGoogle(useRedirect)
      : await signInWithFacebook(useRedirect);

  // Popup mode returns result immediately
  if (result && typeof result === "object" && "user" in result) {
    const firebaseToken = await result.user.getIdToken();
    const backend = await linkWithBackend(firebaseToken);

    if (
      backend &&
      typeof backend === "object" &&
      "access" in backend &&
      "refresh" in backend
    ) {
      const user = await setTokensAndFetchProfile?.(
        backend.access,
        backend.refresh
      );

      toast({
        title: "Success",
        description: `Logged in with ${provider}!`,
      });

      if (user?.role === "agent") return navigate("/agent", { replace: true });
      if (user?.role === "superuser")
        return navigate("/admin", { replace: true });

      return navigate("/dashboard", { replace: true });
    }
  }

  // Redirect mode
  if (useRedirect) {
    toast({
      title: "Redirecting...",
      description: "Complete authentication in the opened window.",
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                             LOGIN BUTTON COMPONENT                          */
/* -------------------------------------------------------------------------- */

export function FirebaseLoginButton({
  provider,
  variant = "outline",
  size = "default",
  className = "",
  fullWidth = false,
  disabled = false,
}: FirebaseLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithGoogle, signInWithFacebook, linkWithBackend } =
    useFirebaseAuth();
  const { setTokensAndFetchProfile } = useAuth();

  const handleLogin = useCallback(async () => {
    try {
      setLoading(true);
      await completeAuthFlow({
        provider,
        signInWithGoogle,
        signInWithFacebook,
        linkWithBackend,
        setTokensAndFetchProfile,
        navigate,
        toast,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || `Failed to authenticate with ${provider}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    provider,
    navigate,
    toast,
    signInWithGoogle,
    signInWithFacebook,
    linkWithBackend,
    setTokensAndFetchProfile,
  ]);

  const meta = PROVIDER_META[provider];

  return (
    <Button
      onClick={handleLogin}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span className="text-base">{meta.icon}</span>
      )}
      {loading ? "Signing in..." : `Sign in with ${meta.label}`}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                             LOGIN FORM COMPONENT                            */
/* -------------------------------------------------------------------------- */

interface FirebaseLoginFormProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: Error) => void;
}

export function FirebaseLoginForm({ onSuccess, onError }: FirebaseLoginFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithGoogle, signInWithFacebook, linkWithBackend } =
    useFirebaseAuth();
  const { setTokensAndFetchProfile } = useAuth();

  const login = async (provider: "google" | "facebook") => {
    try {
      setLoading(true);

      const user = await completeAuthFlow({
        provider,
        signInWithGoogle,
        signInWithFacebook,
        linkWithBackend,
        setTokensAndFetchProfile,
        navigate,
        toast,
      });

      if (user) onSuccess?.(user);
    } catch (err: any) {
      const e = new Error(err?.message || "Login failed");
      onError?.(e);
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <FirebaseLoginButton provider="google" fullWidth disabled={loading} />
      <FirebaseLoginButton provider="facebook" fullWidth disabled={loading} />
    </div>
  );
}
