import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Flag, MessageSquare, Paperclip, Save, X, Edit3, Clock, CheckCircle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { TimeTracker } from './TimeTracker';
const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};
const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
};
export function TaskDetailModal({ task, open, onOpenChange, onTaskUpdate }) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
    });
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [profiles, setProfiles] = useState([]);
    useEffect(() => {
        if (task) {
            setEditedTask({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                assigned_to: task.assigned_to || '',
            });
        }
    }, [task]);
    useEffect(() => {
        if (open && task) {
            fetchComments();
            fetchProfiles();
        }
    }, [open, task]);
    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('task_comments')
            .select(`
        *,
        profiles:user_id(full_name, avatar_url)
      `)
            .eq('task_id', task.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching comments:', error);
            return;
        }
        setComments(data || []);
    };
    const fetchProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');
        if (error) {
            console.error('Error fetching profiles:', error);
            return;
        }
        setProfiles(data || []);
    };
    const handleSave = async () => {
        const updates = {
            title: editedTask.title,
            description: editedTask.description || null,
            status: editedTask.status,
            priority: editedTask.priority,
            due_date: editedTask.due_date ? new Date(editedTask.due_date).toISOString() : null,
            assigned_to: editedTask.assigned_to || null,
        };
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', task.id);
        if (error) {
            toast.error('Failed to update task');
            return;
        }
        toast.success('Task updated successfully');
        setIsEditing(false);
        onTaskUpdate();
    };
    const handleAddComment = async () => {
        if (!newComment.trim())
            return;
        const { error } = await supabase
            .from('task_comments')
            .insert({
            task_id: task.id,
            user_id: user?.id,
            content: newComment.trim(),
        });
        if (error) {
            toast.error('Failed to add comment');
            return;
        }
        setNewComment('');
        fetchComments();
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    const getAssigneeName = () => {
        if (!task.assignee)
            return 'Unassigned';
        return task.assignee.full_name;
    };
    const getAssigneeAvatar = () => {
        if (!task.assignee)
            return null;
        return task.assignee.avatar_url;
    };
    if (!task)
        return null;
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsx(DialogHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(DialogTitle, { className: "text-xl font-semibold", children: isEditing ? 'Edit Task' : 'Task Details' }), _jsxs("div", { className: "flex items-center gap-2", children: [!isEditing && (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsEditing(true), children: [_jsx(Edit3, { className: "h-4 w-4 mr-2" }), "Edit"] })), isEditing && (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsEditing(false), children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Cancel"] }), _jsxs(Button, { size: "sm", onClick: handleSave, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save"] })] }))] })] }) }), _jsx(ScrollArea, { className: "max-h-[70vh] pr-4", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [isEditing ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", value: editedTask.title, onChange: (e) => setEditedTask({ ...editedTask, title: e.target.value }) })] })) : (_jsx("h2", { className: "text-2xl font-bold", children: task.title })), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Flag, { className: "h-4 w-4 text-muted-foreground" }), _jsx(Badge, { className: priorityColors[task.priority], children: task.priority })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-muted-foreground" }), _jsx(Badge, { className: statusColors[task.status], children: task.status.replace('_', ' ') })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-muted-foreground", children: "Description" }), isEditing ? (_jsx(Textarea, { value: editedTask.description, onChange: (e) => setEditedTask({ ...editedTask, description: e.target.value }), className: "mt-2", rows: 4 })) : (_jsx("p", { className: "mt-2 text-sm", children: task.description || 'No description provided' }))] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-muted-foreground", children: "Project" }), _jsx("p", { className: "mt-2 text-sm font-medium", children: task.projects?.title || 'Unknown Project' })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-muted-foreground", children: "Assignee" }), isEditing ? (_jsxs(Select, { value: editedTask.assigned_to || 'unassigned', onValueChange: (value) => setEditedTask({ ...editedTask, assigned_to: value === 'unassigned' ? '' : value }), children: [_jsx(SelectTrigger, { className: "mt-2", children: _jsx(SelectValue, { placeholder: "Select assignee" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "unassigned", children: "Unassigned" }), profiles.map((profile) => (_jsx(SelectItem, { value: profile.id, children: profile.full_name }, profile.id)))] })] })) : (_jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsxs(Avatar, { className: "h-6 w-6", children: [_jsx(AvatarImage, { src: getAssigneeAvatar() || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(getAssigneeName()) })] }), _jsx("span", { className: "text-sm", children: getAssigneeName() })] }))] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-muted-foreground", children: "Due Date" }), isEditing ? (_jsx(Input, { type: "date", value: editedTask.due_date, onChange: (e) => setEditedTask({ ...editedTask, due_date: e.target.value }), className: "mt-2" })) : (_jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: task.due_date ? formatDate(task.due_date) : 'No due date' })] }))] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-muted-foreground", children: "Status" }), isEditing ? (_jsxs(Select, { value: editedTask.status, onValueChange: (value) => setEditedTask({ ...editedTask, status: value }), children: [_jsx(SelectTrigger, { className: "mt-2", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todo", children: "To Do" }), _jsx(SelectItem, { value: "in_progress", children: "In Progress" }), _jsx(SelectItem, { value: "review", children: "Review" }), _jsx(SelectItem, { value: "done", children: "Done" })] })] })) : (_jsx("div", { className: "mt-2", children: _jsx(Badge, { className: statusColors[task.status], children: task.status.replace('_', ' ') }) }))] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium text-muted-foreground", children: "Priority" }), isEditing ? (_jsxs(Select, { value: editedTask.priority, onValueChange: (value) => setEditedTask({ ...editedTask, priority: value }), children: [_jsx(SelectTrigger, { className: "mt-2", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] })) : (_jsx("div", { className: "mt-2", children: _jsx(Badge, { className: priorityColors[task.priority], children: task.priority }) }))] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5" }), _jsx("h3", { className: "text-lg font-semibold", children: "Time Tracking" })] }), _jsx(TimeTracker, { taskId: task.id, taskTitle: task.title })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Paperclip, { className: "h-5 w-5" }), _jsx("h3", { className: "text-lg font-semibold", children: "Attachments" })] }), _jsx(FileUpload, { entityType: "task", entityId: task.id, onUploadComplete: () => {
                                            // Refresh task data if needed
                                        } })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5" }), _jsx("h3", { className: "text-lg font-semibold", children: "Comments" }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: comments.length })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Textarea, { placeholder: "Add a comment...", value: newComment, onChange: (e) => setNewComment(e.target.value), className: "flex-1", rows: 2 }), _jsx(Button, { onClick: handleAddComment, disabled: !newComment.trim(), children: "Add Comment" })] }), _jsx("div", { className: "space-y-3", children: comments.map((comment) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: comment.profiles?.avatar_url || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(comment.profiles?.full_name || 'U') })] }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-sm font-medium", children: comment.profiles?.full_name || 'Unknown User' }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDate(comment.created_at) })] }), _jsx("p", { className: "text-sm", children: comment.content })] })] }) }) }, comment.id))) })] })] })] }) })] }) }));
}
