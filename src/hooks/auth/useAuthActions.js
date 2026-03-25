import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useAuthActions({
  email,
  password,
  fullName,
  navigate,
  setLoading,
}) {
  const run = async (action) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (e) => {
    e.preventDefault();
    await run(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/dashboard", { state: { justSignedIn: true } });
    }).catch((error) => toast.error(error.message || "Error signing in"));
  };

  const signUp = async (e) => {
    e.preventDefault();
    await run(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      toast.success("Account created! Redirecting...");
      navigate("/dashboard", { state: { justSignedIn: true } });
    }).catch((error) => toast.error(error.message || "Error creating account"));
  };

  const resetPassword = async () => {
    if (!email) return toast.error("Enter your email to reset password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error)
      return toast.error(error.message || "Failed to send reset email");
    toast.success("Password reset email sent");
  };

  const oAuthSignIn = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams:
          provider === "google"
            ? { access_type: "offline", prompt: "consent" }
            : {},
      },
    });
    if (error) toast.error(error.message || "OAuth sign-in failed");
  };

  return { signIn, signUp, resetPassword, oAuthSignIn };
}
