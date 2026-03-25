import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { FolderKanban, CheckSquare, Clock, TrendingUp } from 'lucide-react';
export default function Dashboard() {
    const { user } = useAuth();
    const { roles, isAdmin, isManager } = useUserRole(user?.id);
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
    });
    useEffect(() => {
        const fetchStats = async () => {
            if (!user)
                return;
            try {
                // Fetch projects
                const { count: projectCount } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true });
                // Fetch tasks with proper status filtering
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('status, due_date');
                const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0;
                const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
                const overdueTasks = tasks?.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length || 0;
                setStats({
                    totalProjects: projectCount || 0,
                    activeTasks,
                    completedTasks,
                    overdueTasks,
                });
            }
            catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };
        fetchStats();
    }, [user]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Dashboard" }), _jsx("p", { className: "text-muted-foreground", children: "Welcome back! Here's what's happening with your projects." }), roles.length > 0 && (_jsx("div", { className: "mt-2 flex gap-2", children: roles.map(role => (_jsx("span", { className: "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary", children: role.replace('_', ' ') }, role))) }))] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsxs(Card, { className: "hover:shadow-md transition-smooth", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Projects" }), _jsx(FolderKanban, { className: "h-4 w-4 text-primary" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: stats.totalProjects }), _jsx("p", { className: "text-xs text-muted-foreground", children: isAdmin || isManager ? 'All projects' : 'Your projects' })] })] }), _jsxs(Card, { className: "hover:shadow-md transition-smooth", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Active Tasks" }), _jsx(CheckSquare, { className: "h-4 w-4 text-primary" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: stats.activeTasks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Tasks in progress" })] })] }), _jsxs(Card, { className: "hover:shadow-md transition-smooth", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Completed" }), _jsx(TrendingUp, { className: "h-4 w-4 text-secondary" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: stats.completedTasks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Tasks finished" })] })] }), _jsxs(Card, { className: "hover:shadow-md transition-smooth", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Overdue" }), _jsx(Clock, { className: "h-4 w-4 text-destructive" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: stats.overdueTasks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Needs attention" })] })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Activity" }), _jsx(CardDescription, { children: "Latest updates across your projects" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Activity feed coming soon..." }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Quick Actions" }), _jsx(CardDescription, { children: "Common tasks and shortcuts" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Quick actions coming soon..." }) })] })] })] }));
}
