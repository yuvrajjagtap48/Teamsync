import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Chatbot } from "@/components/chat/Chatbot";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
export function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && location.state?.justSignedIn) {
      const name = user.user_metadata?.full_name || user.email || "there";
      toast.success(`Welcome, ${name}!`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [user, location, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-subtle">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur">
            <SidebarTrigger />
          </header>
          <div className="p-6">{children}</div>
        </main>
        <Chatbot />
        <KeyboardShortcuts />
      </div>
    </SidebarProvider>
  );
}
