import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, RefreshCcw, FileText, Users, UserPlus, X, Search } from 'lucide-react';
import { ProjectTemplateSelector } from '@/components/ProjectTemplateSelector';
const statusVariants = {
    planning: { label: 'Planning', variant: 'secondary' },
    active: { label: 'Active', variant: 'default' },
    on_hold: { label: 'On Hold', variant: 'outline' },
    completed: { label: 'Completed', variant: 'secondary' },
};
export default function Projects() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [status, setStatus] = useState('planning');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const envReady = useMemo(() => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY), []);
    const { data: projects, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select(`
          *,
          project_members(
            user_id,
            profiles:user_id(id, full_name, avatar_url)
          )
        `)
                .order('updated_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
        enabled: envReady && !!user,
    });
    const { data: profiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');
            if (error)
                throw error;
            return data;
        },
        enabled: envReady && !!user,
    });
    useEffect(() => {
        if (!envReady)
            return;
        const ch = supabase
            .channel('projects-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        })
            .subscribe();
        return () => {
            supabase.removeChannel(ch);
        };
    }, [queryClient, envReady]);
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setDeadline('');
        setStatus('planning');
    };
    const createProject = async () => {
        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }
        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            manager_id: user?.id ?? null,
            progress: 0,
            status: status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: '', // will be ignored by Supabase
        };
        const { error } = await supabase.from('projects').insert({
            title: payload.title,
            description: payload.description,
            deadline: payload.deadline,
            manager_id: payload.manager_id,
            progress: payload.progress,
            status: payload.status,
        });
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success('Project created');
        setOpen(false);
        resetForm();
        refetch();
    };
    const createProjectFromTemplate = async (template) => {
        try {
            // Create the project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                title: template.name,
                description: template.description,
                manager_id: user?.id ?? null,
                progress: 0,
                status: 'planning',
            })
                .select()
                .single();
            if (projectError) {
                toast.error('Failed to create project');
                return;
            }
            // Create tasks from template
            if (template.tasks && template.tasks.length > 0) {
                const tasksToInsert = template.tasks.map((task) => ({
                    project_id: project.id,
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    status: 'todo',
                    created_by: user?.id,
                }));
                const { error: tasksError } = await supabase
                    .from('tasks')
                    .insert(tasksToInsert);
                if (tasksError) {
                    toast.error('Project created but failed to add tasks');
                    return;
                }
            }
            toast.success('Project created from template successfully');
            refetch();
        }
        catch (error) {
            toast.error('Failed to create project from template');
            console.error('Template project creation error:', error);
        }
    };
    const updateProject = async (id, updates) => {
        const { error } = await supabase.from('projects').update(updates).eq('id', id);
        if (error)
            toast.error(error.message);
    };
    const addProjectMember = async (projectId, userId) => {
        const { error } = await supabase
            .from('project_members')
            .insert({ project_id: projectId, user_id: userId });
        if (error) {
            if (error.code === '23505') {
                toast.error('Member already added to project');
            }
            else {
                toast.error('Failed to add member');
            }
            return;
        }
        toast.success('Member added to project');
        refetch();
    };
    const removeProjectMember = async (projectId, userId) => {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId);
        if (error) {
            toast.error('Failed to remove member');
            return;
        }
        toast.success('Member removed from project');
        refetch();
    };
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    const filteredProjects = useMemo(() => {
        if (!projects)
            return [];
        return projects.filter((p) => {
            const matchesSearch = searchQuery === '' ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, statusFilter]);
    if (!envReady) {
        return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Projects" }), _jsx("p", { className: "text-muted-foreground", children: "Connect Supabase to manage projects." })] }), _jsx(Card, { children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Supabase not configured" }), _jsx(CardDescription, { children: "Provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then refresh. Use Open MCP popover to connect Supabase." })] }) })] }) }));
    }
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Projects" }), _jsx("p", { className: "text-muted-foreground", children: "Manage and track all your projects" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => refetch(), disabled: isFetching, children: [_jsx(RefreshCcw, { className: `mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}` }), " Refresh"] }), _jsx(ProjectTemplateSelector, { onTemplateSelect: createProjectFromTemplate, children: _jsxs(Button, { variant: "outline", children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), " From Template"] }) }), _jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " New Project"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "New Project" }), _jsx(DialogDescription, { children: "Create a project with basic details." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Website Redesign" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "desc", children: "Description" }), _jsx(Textarea, { id: "desc", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Goals, scope, and outcomes" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "deadline", children: "Deadline" }), _jsx(Input, { id: "deadline", type: "date", value: deadline, onChange: (e) => setDeadline(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: status, onValueChange: (v) => setStatus(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "planning", children: "Planning" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "on_hold", children: "On Hold" }), _jsx(SelectItem, { value: "on_completed", children: "Completed" })] })] })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { onClick: createProject, children: "Create" })] })] })] })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search projects...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-full sm:w-[180px]", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "planning", children: "Planning" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "on_hold", children: "On Hold" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] })] })] }), isLoading ? (_jsx("div", { className: "text-muted-foreground", children: "Loading projects..." })) : !projects || projects.length === 0 ? (_jsx(Card, { children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "No projects yet" }), _jsx(CardDescription, { children: "Click \"New Project\" to create your first project." })] }) })) : filteredProjects.length === 0 ? (_jsx(Card, { children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "No projects found" }), _jsx(CardDescription, { children: "Try adjusting your search or filters." })] }) })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredProjects.map((p) => {
                        const projectMembers = p.project_members || [];
                        const memberIds = projectMembers.map((pm) => pm.user_id);
                        const availableProfiles = profiles?.filter(prof => !memberIds.includes(prof.id)) || [];
                        return (_jsxs(Card, { className: "hover:shadow-md transition-smooth", children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: p.title }), _jsx(Badge, { variant: statusVariants[p.status].variant, children: statusVariants[p.status].label })] }), p.description && (_jsx(CardDescription, { className: "line-clamp-2", children: p.description }))] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-sm mb-2", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { className: "text-muted-foreground", children: [p.progress, "%"] })] }), _jsx(Progress, { value: p.progress })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Status" }), _jsxs(Select, { defaultValue: p.status, onValueChange: (v) => updateProject(p.id, { status: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "planning", children: "Planning" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "on_hold", children: "On Hold" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Progress" }), _jsx(Slider, { defaultValue: [p.progress], max: 100, step: 5, onValueCommit: (val) => updateProject(p.id, { progress: val[0] }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { className: "text-xs flex items-center gap-1", children: [_jsx(Users, { className: "h-3 w-3" }), "Team Members (", projectMembers.length, ")"] }), availableProfiles.length > 0 && (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2", children: _jsx(UserPlus, { className: "h-3 w-3" }) }) }), _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Team Member" }), _jsx(DialogDescription, { children: "Select a team member to add to this project" })] }), _jsx("div", { className: "space-y-2 max-h-[300px] overflow-y-auto", children: availableProfiles.map((profile) => (_jsxs("div", { className: "flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer", onClick: () => addProjectMember(p.id, profile.id), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: profile.avatar_url || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(profile.full_name) })] }), _jsx("span", { className: "text-sm", children: profile.full_name })] }), _jsx(Button, { variant: "ghost", size: "sm", children: "Add" })] }, profile.id))) })] })] }))] }), _jsx("div", { className: "flex flex-wrap gap-1", children: projectMembers.length === 0 ? (_jsx("span", { className: "text-xs text-muted-foreground", children: "No members assigned" })) : (projectMembers.map((pm) => {
                                                        const profile = pm.profiles;
                                                        if (!profile)
                                                            return null;
                                                        return (_jsxs("div", { className: "group relative", children: [_jsxs(Avatar, { className: "h-7 w-7 border-2 border-background", children: [_jsx(AvatarImage, { src: profile.avatar_url || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(profile.full_name) })] }), _jsx("div", { className: "absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-md", children: profile.full_name }), _jsx(Button, { variant: "ghost", size: "sm", className: "absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full", onClick: () => removeProjectMember(p.id, pm.user_id), children: _jsx(X, { className: "h-3 w-3" }) })] }, pm.user_id));
                                                    })) })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: p.deadline ? `Due ${new Date(p.deadline).toLocaleDateString()}` : 'No deadline' })] })] }, p.id));
                    }) }))] }) }));
}
