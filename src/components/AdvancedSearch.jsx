import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Calendar, User, FolderKanban, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
export function AdvancedSearch({ children, onResultSelect }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState({
        query: '',
        type: 'all',
        status: '',
        priority: '',
        assignee: '',
        project: '',
        dateRange: '',
        tags: [],
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    useEffect(() => {
        if (open) {
            fetchProjects();
            fetchUsers();
        }
    }, [open]);
    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('title');
        if (error) {
            console.error('Error fetching projects:', error);
            return;
        }
        setProjects(data || []);
    };
    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');
        if (error) {
            console.error('Error fetching users:', error);
            return;
        }
        setUsers(data || []);
    };
    const performSearch = async () => {
        if (!filters.query.trim()) {
            toast.error('Please enter a search query');
            return;
        }
        setLoading(true);
        try {
            const searchResults = [];
            // Search tasks
            if (filters.type === 'all' || filters.type === 'tasks') {
                let taskQuery = supabase
                    .from('tasks')
                    .select(`
            *,
            projects:project_id(title, status),
            assignee:assigned_to(full_name, avatar_url),
            creator:created_by(full_name, avatar_url)
          `)
                    .or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
                if (filters.status) {
                    taskQuery = taskQuery.eq('status', filters.status);
                }
                if (filters.priority) {
                    taskQuery = taskQuery.eq('priority', filters.priority);
                }
                if (filters.assignee) {
                    taskQuery = taskQuery.eq('assigned_to', filters.assignee);
                }
                if (filters.project) {
                    taskQuery = taskQuery.eq('project_id', filters.project);
                }
                const { data: tasks, error: tasksError } = await taskQuery;
                if (tasksError)
                    throw tasksError;
                searchResults.push(...(tasks || []).map(task => ({
                    ...task,
                    type: 'task',
                    searchableText: `${task.title} ${task.description || ''}`.toLowerCase(),
                })));
            }
            // Search projects
            if (filters.type === 'all' || filters.type === 'projects') {
                let projectQuery = supabase
                    .from('projects')
                    .select('*')
                    .or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
                if (filters.status) {
                    projectQuery = projectQuery.eq('status', filters.status);
                }
                const { data: projects, error: projectsError } = await projectQuery;
                if (projectsError)
                    throw projectsError;
                searchResults.push(...(projects || []).map(project => ({
                    ...project,
                    type: 'project',
                    searchableText: `${project.title} ${project.description || ''}`.toLowerCase(),
                })));
            }
            // Search users
            if (filters.type === 'all' || filters.type === 'users') {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('full_name', `%${filters.query}%`);
                if (profilesError)
                    throw profilesError;
                searchResults.push(...(profiles || []).map(profile => ({
                    ...profile,
                    type: 'user',
                    searchableText: profile.full_name.toLowerCase(),
                })));
            }
            // Filter by date range
            if (filters.dateRange) {
                const now = new Date();
                let startDate;
                switch (filters.dateRange) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    default:
                        startDate = new Date(0);
                }
                const filteredResults = searchResults.filter(result => {
                    const resultDate = new Date(result.created_at);
                    return resultDate >= startDate;
                });
                setResults(filteredResults);
            }
            else {
                setResults(searchResults);
            }
        }
        catch (error) {
            toast.error('Search failed');
            console.error('Search error:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    const getResultIcon = (type) => {
        switch (type) {
            case 'task':
                return CheckSquare;
            case 'project':
                return FolderKanban;
            case 'user':
                return User;
            default:
                return Search;
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'low':
                return 'bg-gray-100 text-gray-800';
            case 'medium':
                return 'bg-blue-100 text-blue-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'urgent':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'todo':
                return 'bg-gray-100 text-gray-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'review':
                return 'bg-yellow-100 text-yellow-800';
            case 'done':
                return 'bg-green-100 text-green-800';
            case 'planning':
                return 'bg-purple-100 text-purple-800';
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'on_hold':
                return 'bg-orange-100 text-orange-800';
            case 'completed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Advanced Search" }), _jsx(DialogDescription, { children: "Search across tasks, projects, and team members with advanced filters" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Search for tasks, projects, or people...", value: filters.query, onChange: (e) => setFilters({ ...filters, query: e.target.value }), onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                performSearch();
                                            }
                                        } }), _jsxs(Button, { onClick: performSearch, disabled: loading, children: [_jsx(Search, { className: "h-4 w-4 mr-2" }), "Search"] })] }), _jsxs(Tabs, { defaultValue: "filters", className: "w-full", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "filters", children: "Filters" }), _jsxs(TabsTrigger, { value: "results", children: ["Results (", results.length, ")"] })] }), _jsxs(TabsContent, { value: "filters", className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: filters.type, onValueChange: (value) => setFilters({ ...filters, type: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All" }), _jsx(SelectItem, { value: "tasks", children: "Tasks" }), _jsx(SelectItem, { value: "projects", children: "Projects" }), _jsx(SelectItem, { value: "users", children: "Users" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: filters.status || 'any', onValueChange: (value) => setFilters({ ...filters, status: value === 'any' ? '' : value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Any status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "any", children: "Any status" }), _jsx(SelectItem, { value: "todo", children: "To Do" }), _jsx(SelectItem, { value: "in_progress", children: "In Progress" }), _jsx(SelectItem, { value: "review", children: "Review" }), _jsx(SelectItem, { value: "done", children: "Done" }), _jsx(SelectItem, { value: "planning", children: "Planning" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "on_hold", children: "On Hold" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Priority" }), _jsxs(Select, { value: filters.priority || 'any', onValueChange: (value) => setFilters({ ...filters, priority: value === 'any' ? '' : value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Any priority" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "any", children: "Any priority" }), _jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Date Range" }), _jsxs(Select, { value: filters.dateRange || 'any', onValueChange: (value) => setFilters({ ...filters, dateRange: value === 'any' ? '' : value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Any time" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "any", children: "Any time" }), _jsx(SelectItem, { value: "today", children: "Today" }), _jsx(SelectItem, { value: "week", children: "This Week" }), _jsx(SelectItem, { value: "month", children: "This Month" })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Project" }), _jsxs(Select, { value: filters.project || 'any', onValueChange: (value) => setFilters({ ...filters, project: value === 'any' ? '' : value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Any project" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "any", children: "Any project" }), projects.map((project) => (_jsx(SelectItem, { value: project.id, children: project.title }, project.id)))] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Assignee" }), _jsxs(Select, { value: filters.assignee || 'any', onValueChange: (value) => setFilters({ ...filters, assignee: value === 'any' ? '' : value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Any assignee" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "any", children: "Any assignee" }), users.map((user) => (_jsx(SelectItem, { value: user.id, children: user.full_name }, user.id)))] })] })] })] })] }), _jsx(TabsContent, { value: "results", className: "space-y-4", children: _jsx(ScrollArea, { className: "h-96", children: loading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Searching..." })) : results.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No results found. Try adjusting your search criteria." })) : (_jsx("div", { className: "space-y-3", children: results.map((result, index) => {
                                                    const Icon = getResultIcon(result.type);
                                                    return (_jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Icon, { className: "h-5 w-5 text-muted-foreground mt-1" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("h4", { className: "font-medium", children: result.title || result.full_name }), _jsx(Badge, { variant: "outline", className: "text-xs", children: result.type }), result.status && (_jsx(Badge, { className: `text-xs ${getStatusColor(result.status)}`, children: result.status.replace('_', ' ') })), result.priority && (_jsx(Badge, { className: `text-xs ${getPriorityColor(result.priority)}`, children: result.priority }))] }), result.description && (_jsx("p", { className: "text-sm text-muted-foreground mb-2", children: result.description })), _jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), format(new Date(result.created_at), 'MMM dd, yyyy')] }), result.type === 'task' && result.assignee && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(User, { className: "h-3 w-3" }), result.assignee.full_name] })), result.type === 'task' && result.projects && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(FolderKanban, { className: "h-3 w-3" }), result.projects.title] }))] })] })] }) }) }, `${result.type}-${result.id}-${index}`));
                                                }) })) }) })] })] })] })] }));
}
