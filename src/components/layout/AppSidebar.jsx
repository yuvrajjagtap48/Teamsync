import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Bell, Users, BarChart3, Search, MessageCircle, LogOut, Rocket, } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar, } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { TeamChat } from '@/components/TeamChat';
import { useUserRole } from '@/hooks/useUserRole';
import { Settings, Shield } from 'lucide-react';
const baseNavigation = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Projects', url: '/projects', icon: FolderKanban },
    { title: 'Tasks', url: '/tasks', icon: CheckSquare },
    { title: 'Team', url: '/team', icon: Users },
    { title: 'Analytics', url: '/analytics', icon: BarChart3 },
    { title: 'Notifications', url: '/notifications', icon: Bell },
];
const adminNavigation = [
    { title: 'Admin', url: '/admin', icon: Shield },
    { title: 'Settings', url: '/settings', icon: Settings },
];
export function AppSidebar() {
    const { state } = useSidebar();
    const { signOut, user } = useAuth();
    const { isAdmin } = useUserRole(user?.id);
    const collapsed = state === 'collapsed';
    const navigation = isAdmin ? [...baseNavigation, ...adminNavigation] : baseNavigation;
    const { data: unreadNotifications } = useQuery({
        queryKey: ['unread-notifications'],
        queryFn: async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .eq('read', false);
            return count || 0;
        },
        enabled: !!user,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
    return (_jsxs(Sidebar, { className: collapsed ? 'w-16' : 'w-64', collapsible: "icon", children: [_jsxs(SidebarContent, { children: [_jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary", children: _jsx(Rocket, { className: "w-5 h-5 text-white" }) }), !collapsed && (_jsx("span", { className: "font-bold text-lg text-sidebar-foreground", children: "TeamSync" }))] }) }), _jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Navigation" }), _jsx(SidebarGroupContent, { children: _jsx(SidebarMenu, { children: navigation.map((item) => (_jsx(SidebarMenuItem, { children: _jsx(SidebarMenuButton, { asChild: true, children: _jsx(NavLink, { to: item.url, className: ({ isActive }) => isActive
                                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                                    : 'hover:bg-sidebar-accent/50', children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(item.icon, { className: "h-4 w-4" }), !collapsed && _jsx("span", { children: item.title }), item.title === 'Notifications' && unreadNotifications && unreadNotifications > 0 && (_jsx(Badge, { variant: "destructive", className: "text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center", children: unreadNotifications > 99 ? '99+' : unreadNotifications }))] }) }) }) }, item.title))) }) })] }), _jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Quick Actions" }), _jsx(SidebarGroupContent, { children: _jsxs(SidebarMenu, { children: [_jsx(SidebarMenuItem, { children: _jsx(AdvancedSearch, { children: _jsxs(SidebarMenuButton, { className: "w-full", children: [_jsx(Search, { className: "h-4 w-4" }), !collapsed && _jsx("span", { children: "Search" })] }) }) }), _jsx(SidebarMenuItem, { children: _jsx(TeamChat, { children: _jsxs(SidebarMenuButton, { className: "w-full", children: [_jsx(MessageCircle, { className: "h-4 w-4" }), !collapsed && _jsx("span", { children: "Chat" })] }) }) })] }) })] })] }), _jsx(SidebarFooter, { children: _jsxs(Button, { variant: "ghost", className: "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent", onClick: signOut, children: [_jsx(LogOut, { className: "h-4 w-4" }), !collapsed && _jsx("span", { className: "ml-2", children: "Sign Out" })] }) })] }));
}
