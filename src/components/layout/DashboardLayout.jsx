import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Chatbot } from '@/components/chat/Chatbot';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
export function DashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth');
        }
    }, [user, loading, navigate]);
    useEffect(() => {
        if (user && location.state?.justSignedIn) {
            const name = user.user_metadata?.full_name || user.email || 'there';
            toast.success(`Welcome, ${name}!`);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [user, location, navigate]);
    if (loading) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    if (!user) {
        return null;
    }
    return (_jsx(SidebarProvider, { children: _jsxs("div", { className: "flex min-h-screen w-full bg-gradient-subtle", children: [_jsx(AppSidebar, {}), _jsxs("main", { className: "flex-1 overflow-auto", children: [_jsx("header", { className: "sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6", children: _jsx(SidebarTrigger, {}) }), _jsx("div", { className: "p-6", children: children })] }), _jsx(Chatbot, {}), _jsx(KeyboardShortcuts, {})] }) }));
}
