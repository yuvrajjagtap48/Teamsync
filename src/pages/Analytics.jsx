import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle, AlertTriangle, Calendar, Target, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
export default function Analytics() {
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState('7d');
    const [selectedProject, setSelectedProject] = useState('all');
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
    const { data: tasks } = useQuery({
        queryKey: ['tasks-analytics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
          *,
          projects:project_id(title, status),
          assignee:assigned_to(full_name)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
    const { data: teamMembers } = useQuery({
        queryKey: ['profiles-analytics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          *,
          user_roles(role)
        `);
            if (error)
                throw error;
            return data;
        },
    });
    const getDateRange = () => {
        const now = new Date();
        switch (timeRange) {
            case '7d':
                return { start: subDays(now, 7), end: now };
            case '30d':
                return { start: subDays(now, 30), end: now };
            case '90d':
                return { start: subDays(now, 90), end: now };
            default:
                return { start: subDays(now, 7), end: now };
        }
    };
    const filteredTasks = tasks?.filter(task => {
        const taskDate = new Date(task.created_at);
        const { start, end } = getDateRange();
        if (selectedProject !== 'all') {
            return task.project_id === selectedProject && taskDate >= start && taskDate <= end;
        }
        return taskDate >= start && taskDate <= end;
    }) || [];
    const getTaskStatusData = () => {
        const statusCounts = filteredTasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {});
        return [
            { name: 'To Do', value: statusCounts.todo || 0, color: '#94A3B8' },
            { name: 'In Progress', value: statusCounts.in_progress || 0, color: '#3B82F6' },
            { name: 'Review', value: statusCounts.review || 0, color: '#F59E0B' },
            { name: 'Done', value: statusCounts.done || 0, color: '#10B981' },
        ];
    };
    const getPriorityData = () => {
        const priorityCounts = filteredTasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});
        return [
            { name: 'Low', value: priorityCounts.low || 0, color: '#6B7280' },
            { name: 'Medium', value: priorityCounts.medium || 0, color: '#3B82F6' },
            { name: 'High', value: priorityCounts.high || 0, color: '#F59E0B' },
            { name: 'Urgent', value: priorityCounts.urgent || 0, color: '#EF4444' },
        ];
    };
    const getProjectProgressData = () => {
        return projects?.map(project => ({
            name: project.title,
            progress: project.progress,
            tasks: tasks?.filter(task => task.project_id === project.id).length || 0,
            completed: tasks?.filter(task => task.project_id === project.id && task.status === 'done').length || 0,
        })) || [];
    };
    const getTaskTrendData = () => {
        const { start, end } = getDateRange();
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const trendData = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
            const dayTasks = tasks?.filter(task => {
                const taskDate = new Date(task.created_at);
                return taskDate.toDateString() === date.toDateString();
            }) || [];
            trendData.push({
                date: format(date, 'MMM dd'),
                created: dayTasks.length,
                completed: dayTasks.filter(task => task.status === 'done').length,
            });
        }
        return trendData;
    };
    const getTeamProductivityData = () => {
        const memberStats = teamMembers?.map(member => {
            const memberTasks = tasks?.filter(task => task.assigned_to === member.id) || [];
            const completedTasks = memberTasks.filter(task => task.status === 'done').length;
            return {
                name: member.full_name,
                total: memberTasks.length,
                completed: completedTasks,
                productivity: memberTasks.length > 0 ? (completedTasks / memberTasks.length) * 100 : 0,
            };
        }) || [];
        return memberStats.sort((a, b) => b.productivity - a.productivity);
    };
    const getOverdueTasks = () => {
        const now = new Date();
        return tasks?.filter(task => task.due_date &&
            new Date(task.due_date) < now &&
            task.status !== 'done') || [];
    };
    const getUpcomingDeadlines = () => {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return tasks?.filter(task => task.due_date &&
            new Date(task.due_date) > now &&
            new Date(task.due_date) <= nextWeek &&
            task.status !== 'done') || [];
    };
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'done').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const overdueTasks = getOverdueTasks().length;
    const upcomingDeadlines = getUpcomingDeadlines().length;
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Analytics & Reports" }), _jsx("p", { className: "text-muted-foreground", children: "Track project performance and team productivity" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Select, { value: timeRange, onValueChange: setTimeRange, children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "7d", children: "Last 7 days" }), _jsx(SelectItem, { value: "30d", children: "Last 30 days" }), _jsx(SelectItem, { value: "90d", children: "Last 90 days" })] })] }), _jsxs(Select, { value: selectedProject, onValueChange: setSelectedProject, children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Projects" }), projects?.map((project) => (_jsx(SelectItem, { value: project.id, children: project.title }, project.id)))] })] })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Tasks" }), _jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: totalTasks }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [filteredTasks.length, " in selected period"] }), _jsx(Progress, { value: 100, className: "mt-2 h-1" })] })] }), _jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Completion Rate" }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-500" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: [Math.round(completionRate), "%"] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [completedTasks, " of ", totalTasks, " completed"] }), _jsx(Progress, { value: completionRate, className: "mt-2 h-1" })] })] }), _jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Overdue Tasks" }), _jsx(AlertTriangle, { className: "h-4 w-4 text-red-500" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: overdueTasks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Need immediate attention" }), overdueTasks > 0 && (_jsx(Badge, { variant: "destructive", className: "mt-2", children: "Action Required" }))] })] }), _jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Upcoming Deadlines" }), _jsx(Calendar, { className: "h-4 w-4 text-orange-500" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: upcomingDeadlines }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Due within 7 days" }), upcomingDeadlines > 0 && (_jsx(Badge, { variant: "outline", className: "mt-2 text-orange-600 border-orange-600", children: "Plan Ahead" }))] })] })] }), _jsxs(Tabs, { defaultValue: "overview", className: "space-y-4", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "projects", children: "Projects" }), _jsx(TabsTrigger, { value: "team", children: "Team" }), _jsx(TabsTrigger, { value: "trends", children: "Trends" })] }), _jsx(TabsContent, { value: "overview", className: "space-y-4", children: _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Task Status Distribution" }), _jsx(CardDescription, { children: "Current status of all tasks" })] }), _jsx(CardContent, { children: totalTasks === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-[300px] text-muted-foreground", children: [_jsx(Activity, { className: "h-12 w-12 mb-2 opacity-20" }), _jsx("p", { children: "No tasks to display" })] })) : (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: getTaskStatusData(), cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : '', outerRadius: 80, fill: "#8884d8", dataKey: "value", children: getTaskStatusData().map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) })) })] }), _jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Priority Distribution" }), _jsx(CardDescription, { children: "Task priorities breakdown" })] }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: getPriorityData(), children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "value", children: getPriorityData().map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) })] }) }) })] })] }) }), _jsx(TabsContent, { value: "projects", className: "space-y-4", children: _jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Project Progress" }), _jsx(CardDescription, { children: "Progress and task counts for each project" })] }), _jsx(CardContent, { children: !projects || projects.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-[400px] text-muted-foreground", children: [_jsx(Target, { className: "h-12 w-12 mb-2 opacity-20" }), _jsx("p", { children: "No projects to analyze" })] })) : (_jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(BarChart, { data: getProjectProgressData(), children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "progress", fill: "#8884d8", name: "Progress %" }), _jsx(Bar, { dataKey: "tasks", fill: "#82ca9d", name: "Total Tasks" }), _jsx(Bar, { dataKey: "completed", fill: "#ffc658", name: "Completed Tasks" })] }) })) })] }) }), _jsx(TabsContent, { value: "team", className: "space-y-4", children: _jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Team Productivity" }), _jsx(CardDescription, { children: "Task completion rates by team member" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: getTeamProductivityData().length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(Users, { className: "h-12 w-12 mx-auto mb-2 opacity-20" }), _jsx("p", { children: "No team productivity data available" })] })) : (getTeamProductivityData().map((member, index) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx(Users, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: member.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [member.completed, " of ", member.total, " tasks completed"] })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-lg font-bold", children: [Math.round(member.productivity), "%"] }), _jsx(Progress, { value: member.productivity, className: "w-24 h-2" })] }), member.productivity >= 80 && (_jsxs(Badge, { variant: "default", className: "bg-green-500", children: [_jsx(TrendingUp, { className: "h-3 w-3 mr-1" }), "High"] })), member.productivity < 50 && member.total > 0 && (_jsxs(Badge, { variant: "outline", className: "text-orange-500", children: [_jsx(TrendingDown, { className: "h-3 w-3 mr-1" }), "Low"] }))] })] }, index)))) }) })] }) }), _jsx(TabsContent, { value: "trends", className: "space-y-4", children: _jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Task Trends" }), _jsx(CardDescription, { children: "Task creation and completion over time" })] }), _jsx(CardContent, { children: !tasks || tasks.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-[400px] text-muted-foreground", children: [_jsx(Activity, { className: "h-12 w-12 mb-2 opacity-20" }), _jsx("p", { children: "No trend data available" })] })) : (_jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(AreaChart, { data: getTaskTrendData(), children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Area, { type: "monotone", dataKey: "created", stackId: "1", stroke: "#8884d8", fill: "#8884d8", name: "Tasks Created" }), _jsx(Area, { type: "monotone", dataKey: "completed", stackId: "2", stroke: "#82ca9d", fill: "#82ca9d", name: "Tasks Completed" })] }) })) })] }) })] })] }) }));
}
