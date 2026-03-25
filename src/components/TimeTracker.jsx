import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Play, Square, Clock, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
export function TimeTracker({ taskId, taskTitle }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isRunning, setIsRunning] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [description, setDescription] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const { data: timeEntries, refetch } = useQuery({
        queryKey: ['time-entries', taskId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('time_entries')
                .select('*')
                .eq('task_id', taskId)
                .order('start_time', { ascending: false });
            if (error)
                throw error;
            // Fetch profiles separately
            const userIds = [...new Set(data.map(e => e.user_id))];
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);
            const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
            return data.map(entry => ({
                ...entry,
                profiles: profilesMap.get(entry.user_id) ? {
                    full_name: profilesMap.get(entry.user_id).full_name
                } : undefined
            }));
        },
    });
    const { data: activeEntry } = useQuery({
        queryKey: ['active-time-entry', taskId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('time_entries')
                .select('*')
                .eq('task_id', taskId)
                .eq('user_id', user?.id)
                .is('end_time', null)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data;
        },
    });
    useEffect(() => {
        if (activeEntry) {
            setIsRunning(true);
            setCurrentEntry(activeEntry);
            setDescription(activeEntry.description || '');
        }
        else {
            setIsRunning(false);
            setCurrentEntry(null);
        }
    }, [activeEntry]);
    useEffect(() => {
        let interval;
        if (isRunning && currentEntry) {
            interval = setInterval(() => {
                const startTime = new Date(currentEntry.start_time).getTime();
                const now = Date.now();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }, 1000);
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [isRunning, currentEntry]);
    const startTimer = async () => {
        if (!description.trim()) {
            toast.error('Please enter a description');
            return;
        }
        const { data, error } = await supabase
            .from('time_entries')
            .insert({
            task_id: taskId,
            user_id: user?.id,
            description: description.trim(),
            start_time: new Date().toISOString(),
        })
            .select()
            .single();
        if (error) {
            toast.error('Failed to start timer');
            return;
        }
        setCurrentEntry(data);
        setIsRunning(true);
        setElapsedTime(0);
        toast.success('Timer started');
        refetch();
    };
    const stopTimer = async () => {
        if (!currentEntry)
            return;
        const { error } = await supabase
            .from('time_entries')
            .update({
            end_time: new Date().toISOString(),
        })
            .eq('id', currentEntry.id);
        if (error) {
            toast.error('Failed to stop timer');
            return;
        }
        setIsRunning(false);
        setCurrentEntry(null);
        setElapsedTime(0);
        setDescription('');
        toast.success('Timer stopped');
        refetch();
    };
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };
    const totalTime = timeEntries?.reduce((total, entry) => {
        return total + (entry.duration_minutes || 0);
    }, 0) || 0;
    const totalBillableTime = totalTime; // All time is billable by default
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5" }), "Time Tracking"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Input, { id: "description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "What are you working on?", disabled: isRunning })] }), _jsxs("div", { className: "flex items-center gap-3", children: [!isRunning ? (_jsxs(Button, { onClick: startTimer, disabled: !description.trim(), children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Start Timer"] })) : (_jsxs(Button, { onClick: stopTimer, variant: "destructive", children: [_jsx(Square, { className: "h-4 w-4 mr-2" }), "Stop Timer"] })), isRunning && (_jsx("div", { className: "text-2xl font-mono font-bold text-primary", children: formatTime(elapsedTime) }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 pt-4 border-t", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", children: formatDuration(totalTime) }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Total Time" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", children: formatDuration(totalBillableTime) }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Billable Time" })] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Time Entries" }) }), _jsx(CardContent, { children: _jsx(ScrollArea, { className: "h-64", children: _jsx("div", { className: "space-y-3", children: timeEntries?.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No time entries yet" })) : (timeEntries?.map((entry) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx("p", { className: "font-medium", children: entry.description }) }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-muted-foreground mt-1", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(User, { className: "h-3 w-3" }), entry.profiles?.full_name] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), format(new Date(entry.start_time), 'MMM dd, yyyy')] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), format(new Date(entry.start_time), 'HH:mm'), entry.end_time && ` - ${format(new Date(entry.end_time), 'HH:mm')}`] })] })] }), _jsx("div", { className: "text-right", children: _jsx("div", { className: "font-bold", children: entry.duration_minutes ? formatDuration(entry.duration_minutes) : 'Running...' }) })] }, entry.id)))) }) }) })] })] }));
}
