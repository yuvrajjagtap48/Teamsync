import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Calendar, CheckSquare, Square, Trash2, Edit, Search, LayoutGrid, LayoutList } from 'lucide-react';
const statusColumns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
];
const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};
export default function Tasks() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [viewMode, setViewMode] = useState('kanban');
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data, error } = await supabase.from('projects').select('*').order('title');
            if (error)
                throw error;
            return data;
        },
    });
    const { data: tasks, isLoading, refetch } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
          *,
          projects:project_id(title),
          assignee:assigned_to(full_name, avatar_url),
          creator:created_by(full_name, avatar_url)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        },
    });
    const { data: profiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').order('full_name');
            if (error)
                throw error;
            return data;
        },
    });
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setAssignedTo('');
        setSelectedProject('');
    };
    const createTask = async () => {
        if (!title.trim() || !selectedProject) {
            toast.error('Title and project are required');
            return;
        }
        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            project_id: selectedProject,
            priority,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            assigned_to: assignedTo || null,
            created_by: user?.id,
            status: 'todo',
        };
        const { error } = await supabase.from('tasks').insert(payload);
        if (error)
            return toast.error(error.message);
        toast.success('Task created');
        setOpen(false);
        resetForm();
        refetch();
    };
    const toggleTaskSelection = (taskId) => {
        const next = new Set(selectedTasks);
        if (next.has(taskId))
            next.delete(taskId);
        else
            next.add(taskId);
        setSelectedTasks(next);
    };
    const selectAllTasks = () => {
        setSelectedTasks(new Set((tasks || []).map((t) => t.id)));
    };
    const clearSelection = () => setSelectedTasks(new Set());
    const bulkUpdateStatus = async (newStatus) => {
        if (selectedTasks.size === 0)
            return;
        const { error } = await supabase.from('tasks').update({ status: newStatus }).in('id', Array.from(selectedTasks));
        if (error)
            return toast.error('Failed to update tasks');
        toast.success(`Updated ${selectedTasks.size} task(s)`);
        clearSelection();
        refetch();
    };
    const bulkDeleteTasks = async () => {
        if (selectedTasks.size === 0)
            return;
        const { error } = await supabase.from('tasks').delete().in('id', Array.from(selectedTasks));
        if (error)
            return toast.error('Failed to delete tasks');
        toast.success(`Deleted ${selectedTasks.size} task(s)`);
        clearSelection();
        refetch();
    };
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const filteredTasks = useMemo(() => {
        if (!tasks)
            return [];
        return tasks.filter((t) => {
            const matchesSearch = searchQuery === '' ||
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
            const matchesProject = projectFilter === 'all' || t.project_id === projectFilter;
            return matchesSearch && matchesPriority && matchesProject;
        });
    }, [tasks, searchQuery, priorityFilter, projectFilter]);
    const getTasksByStatus = (status) => filteredTasks.filter((t) => t.status === status);
    const sortedTimelineTasks = useMemo(() => {
        return [...filteredTasks].sort((a, b) => {
            if (!a.due_date)
                return 1;
            if (!b.due_date)
                return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
    }, [filteredTasks]);
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Tasks" }), _jsx("p", { className: "text-muted-foreground", children: "Manage tasks across all projects" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: clearSelection, disabled: selectedTasks.size === 0, children: [_jsx(Square, { className: "mr-2 h-4 w-4" }), " Deselect All"] }), _jsxs(Button, { variant: "outline", onClick: selectAllTasks, disabled: !tasks || tasks.length === 0, children: [_jsx(CheckSquare, { className: "mr-2 h-4 w-4" }), " Select All"] }), _jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " New Task"] }) }), _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Task" }), _jsx(DialogDescription, { children: "Add a new task to your project" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Task title" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Task description" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "project", children: "Project" }), _jsxs(Select, { value: selectedProject, onValueChange: setSelectedProject, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects?.map((project) => (_jsx(SelectItem, { value: project.id, children: project.title }, project.id))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "priority", children: "Priority" }), _jsxs(Select, { value: priority, onValueChange: (v) => setPriority(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dueDate", children: "Due Date" }), _jsx(Input, { id: "dueDate", type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "assignee", children: "Assign To" }), _jsxs(Select, { value: assignedTo || 'unassigned', onValueChange: (v) => setAssignedTo(v === 'unassigned' ? '' : v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select assignee" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "unassigned", children: "Unassigned" }), profiles?.map((profile) => (_jsx(SelectItem, { value: profile.id, children: profile.full_name }, profile.id)))] })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { onClick: createTask, children: "Create Task" })] })] })] })] })] }), selectedTasks.size > 0 && (_jsxs("div", { className: "flex items-center gap-2 p-4 bg-muted rounded-lg", children: [_jsxs(Badge, { variant: "secondary", children: [selectedTasks.size, " task", selectedTasks.size > 1 ? 's' : '', " selected"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => bulkUpdateStatus('in_progress'), children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), " Mark In Progress"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => bulkUpdateStatus('done'), children: [_jsx(CheckSquare, { className: "h-4 w-4 mr-2" }), " Mark Done"] }), _jsxs(Button, { variant: "destructive", size: "sm", onClick: bulkDeleteTasks, children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), " Delete"] })] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search tasks...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs(Select, { value: priorityFilter, onValueChange: setPriorityFilter, children: [_jsx(SelectTrigger, { className: "w-full sm:w-[180px]", children: _jsx(SelectValue, { placeholder: "Filter by priority" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Priorities" }), _jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] }), _jsxs(Select, { value: projectFilter, onValueChange: setProjectFilter, children: [_jsx(SelectTrigger, { className: "w-full sm:w-[180px]", children: _jsx(SelectValue, { placeholder: "Filter by project" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Projects" }), projects?.map((project) => (_jsx(SelectItem, { value: project.id, children: project.title }, project.id)))] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: viewMode === 'kanban' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('kanban'), children: [_jsx(LayoutGrid, { className: "h-4 w-4 mr-2" }), "Kanban"] }), _jsxs(Button, { variant: viewMode === 'timeline' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('timeline'), children: [_jsx(LayoutList, { className: "h-4 w-4 mr-2" }), "Timeline"] })] })] })] }), isLoading ? (_jsx("div", { className: "text-muted-foreground", children: "Loading tasks..." })) : viewMode === 'kanban' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: statusColumns.map((column) => {
                        const columnTasks = getTasksByStatus(column.id);
                        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-lg", children: column.title }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: columnTasks.length })] }), _jsxs("div", { className: "space-y-3 min-h-[200px] p-2 border-2 border-dashed border-transparent rounded-lg", children: [columnTasks.map((task) => (_jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("h4", { className: "font-medium text-sm line-clamp-2", children: task.title }), _jsx(Badge, { className: `text-xs ${priorityColors[task.priority]}`, children: task.priority })] }), task.description && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-2", children: task.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsx("div", { className: "flex items-center gap-2", children: task.assignee && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Avatar, { className: "h-4 w-4", children: [_jsx(AvatarImage, { src: task.assignee.avatar_url || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(task.assignee.full_name) })] }), _jsx("span", { children: task.assignee.full_name })] })) }), task.due_date && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsx("span", { children: formatDate(task.due_date) })] }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: task.projects?.title || 'Unknown Project' }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2", onClick: () => toggleTaskSelection(task.id), children: selectedTasks.has(task.id) ? _jsx(CheckSquare, { className: "h-4 w-4 text-primary" }) : _jsx(Square, { className: "h-4 w-4" }) })] })] }) }) }, task.id))), columnTasks.length === 0 && (_jsx(Card, { children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-sm", children: "No tasks" }), _jsx(CardDescription, { children: "Drop or create tasks to get started" })] }) }))] })] }, column.id));
                    }) })) : (_jsxs("div", { className: "space-y-2", children: [sortedTimelineTasks.map((task) => {
                            const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                            const statusColor = task.status === 'done' ? 'bg-green-100 border-green-300' :
                                task.status === 'in_progress' ? 'bg-blue-100 border-blue-300' :
                                    task.status === 'review' ? 'bg-yellow-100 border-yellow-300' :
                                        'bg-gray-100 border-gray-300';
                            return (_jsx(Card, { className: `hover:shadow-md transition-shadow ${statusColor} border-l-4`, children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h4", { className: "font-medium text-sm truncate", children: task.title }), _jsx(Badge, { className: `text-xs ${priorityColors[task.priority]}`, children: task.priority }), _jsx(Badge, { variant: "outline", className: "text-xs", children: task.status.replace('_', ' ') })] }), task.description && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-1 mb-2", children: task.description })), _jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [_jsx("span", { className: "font-medium", children: task.projects?.title || 'Unknown' }), task.assignee && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Avatar, { className: "h-4 w-4", children: [_jsx(AvatarImage, { src: task.assignee.avatar_url || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(task.assignee.full_name) })] }), _jsx("span", { children: task.assignee.full_name })] }))] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [task.due_date && (_jsxs("div", { className: `flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`, children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsx("span", { children: formatDate(task.due_date) }), isOverdue && _jsx(Badge, { variant: "destructive", className: "text-xs ml-1", children: "Overdue" })] })), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2", onClick: () => toggleTaskSelection(task.id), children: selectedTasks.has(task.id) ? _jsx(CheckSquare, { className: "h-4 w-4 text-primary" }) : _jsx(Square, { className: "h-4 w-4" }) })] })] }) }) }, task.id));
                        }), sortedTimelineTasks.length === 0 && (_jsx(Card, { children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "No tasks found" }), _jsx(CardDescription, { children: "Try adjusting your search or filters." })] }) }))] }))] }) }));
}
