import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bot, Send, MessageCircle, X } from 'lucide-react';
const helpText = `I can help with:
• list projects
• create project <title> [due YYYY-MM-DD]
• set status <project title> to <planning|active|on_hold|completed>
• set progress <project title> to <0-100>
�� overdue tasks
• help`;
export function Chatbot() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [lastRequest, setLastRequest] = useState(0);
    const [messages, setMessages] = useState([{
            id: 'welcome', role: 'assistant', ts: Date.now(),
            content: 'Hi! Ask me about your projects and tasks. Type "help" to see commands.'
        }]);
    const bottomRef = useRef(null);
    const envReady = useMemo(() => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY), []);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);
    const append = (role, content) => setMessages((m) => [...m, { id: Math.random().toString(36).slice(2), role, content, ts: Date.now() }]);
    const parseCreate = (text) => {
        // create project Title due 2025-01-31
        const dueMatch = text.match(/due\s+(\d{4}-\d{2}-\d{2})/i);
        const title = text
            .replace(/^create\s+project\s+/i, '')
            .replace(/\s+due\s+\d{4}-\d{2}-\d{2}.*/i, '')
            .trim();
        const deadline = dueMatch ? new Date(dueMatch[1]).toISOString() : null;
        return { title, deadline };
    };
    const handleListProjects = async () => {
        const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(10);
        if (error)
            throw error;
        if (!data || data.length === 0)
            return 'You have no projects yet.';
        const lines = data.map((p) => `• ${p.title} (${p.status}) – ${p.progress}%${p.deadline ? `, due ${new Date(p.deadline).toLocaleDateString()}` : ''}`);
        return lines.join('\n');
    };
    const handleCreateProject = async (title, deadline) => {
        if (!title)
            return 'Please provide a project title.';
        const payload = {
            title,
            description: null,
            deadline: deadline,
            manager_id: user?.id ?? null,
            progress: 0,
            status: 'planning',
        };
        const { error } = await supabase.from('projects').insert([payload]);
        if (error)
            throw error;
        return `Created project "${title}"${deadline ? ` (due ${new Date(deadline).toLocaleDateString()})` : ''}.`;
    };
    // Security: Escape wildcards in user input to prevent filter injection
    const escapeWildcards = (input) => {
        return input.replace(/[%_]/g, '\\$&');
    };
    const handleSetStatus = async (title, status) => {
        const sanitizedTitle = escapeWildcards(title.trim());
        // Validate title length
        if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
            return 'Project title must be between 1 and 200 characters.';
        }
        const { data, error } = await supabase
            .from('projects')
            .update({ status })
            .ilike('title', sanitizedTitle)
            .select('*');
        if (error)
            throw error;
        const count = data?.length || 0;
        if (!count)
            return `No project found matching "${sanitizedTitle}".`;
        // Warn if multiple matches
        if (count > 1) {
            return `Warning: Updated ${count} projects matching "${sanitizedTitle}". Consider using more specific titles.`;
        }
        return `Updated status of ${count} project(s) to ${status}.`;
    };
    const handleSetProgress = async (title, progress) => {
        const sanitizedTitle = escapeWildcards(title.trim());
        // Validate title length
        if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
            return 'Project title must be between 1 and 200 characters.';
        }
        const clamped = Math.max(0, Math.min(100, Math.round(progress)));
        const { data, error } = await supabase
            .from('projects')
            .update({ progress: clamped })
            .ilike('title', sanitizedTitle)
            .select('*');
        if (error)
            throw error;
        const count = data?.length || 0;
        if (!count)
            return `No project found matching "${sanitizedTitle}".`;
        // Warn if multiple matches
        if (count > 1) {
            return `Warning: Updated ${count} projects matching "${sanitizedTitle}". Consider using more specific titles.`;
        }
        return `Updated progress of ${count} project(s) to ${clamped}%.`;
    };
    const handleOverdueTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('title, due_date, status')
            .neq('status', 'done')
            .lt('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(10);
        if (error)
            throw error;
        if (!data || data.length === 0)
            return 'No overdue tasks. Great job!';
        return data.map((t) => `• ${t.title} – due ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'unknown'} (${t.status})`).join('\n');
    };
    const process = async (text) => {
        const q = text.trim();
        // Security: Validate input length
        if (!q)
            return 'Please type something.';
        if (q.length > 500)
            return 'Message too long. Please keep messages under 500 characters.';
        if (!user)
            return 'Please sign in to use the assistant.';
        if (!envReady)
            return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.';
        const lower = q.toLowerCase();
        if (lower === 'help')
            return helpText;
        if (lower.startsWith('list projects'))
            return await handleListProjects();
        if (lower.startsWith('create project')) {
            const { title, deadline } = parseCreate(q);
            return await handleCreateProject(title, deadline);
        }
        if (lower.startsWith('set status')) {
            // set status <project> to <status>
            const m = q.match(/^set\s+status\s+(.+)\s+to\s+(planning|active|on_hold|completed)$/i);
            if (!m)
                return 'Try: set status <project title> to <planning|active|on_hold|completed>';
            return await handleSetStatus(m[1].trim(), m[2].toLowerCase());
        }
        if (lower.startsWith('set progress')) {
            // set progress <project> to 75
            const m = q.match(/^set\s+progress\s+(.+)\s+to\s+(\d{1,3})%?$/i);
            if (!m)
                return 'Try: set progress <project title> to <0-100>';
            return await handleSetProgress(m[1].trim(), Number(m[2]));
        }
        if (lower.includes('overdue') && lower.includes('tasks'))
            return await handleOverdueTasks();
        return `I didn't understand.\n${helpText}`;
    };
    const onSend = async () => {
        const text = input;
        if (!text.trim() || busy)
            return;
        // Security: Rate limiting - prevent spam/abuse
        const now = Date.now();
        if (now - lastRequest < 1000) {
            toast.error('Please wait before sending another message');
            return;
        }
        setLastRequest(now);
        append('user', text);
        setInput('');
        setBusy(true);
        try {
            const reply = await process(text);
            append('assistant', reply);
        }
        catch (e) {
            toast.error(e.message || 'Something went wrong');
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-50", children: !open ? (_jsxs(Button, { size: "lg", className: "shadow-primary", onClick: () => setOpen(true), children: [_jsx(MessageCircle, { className: "mr-2 h-5 w-5" }), " Ask TeamSync"] })) : (_jsxs(Card, { className: "w-[340px] sm:w-[380px] shadow-lg", children: [_jsxs(CardHeader, { className: "py-3 px-4 flex flex-row items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bot, { className: "h-5 w-5 text-primary" }), _jsx(CardTitle, { className: "text-base", children: "TeamSync Assistant" })] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs(CardContent, { className: "px-0 pt-0", children: [_jsx(ScrollArea, { className: "h-64 px-4", children: _jsxs("div", { className: "space-y-3 py-3", children: [messages.map((m) => (_jsx("div", { className: m.role === 'user' ? 'text-right' : 'text-left', children: _jsx("div", { className: `inline-block rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`, children: m.content }) }, m.id))), _jsx("div", { ref: bottomRef })] }) }), _jsxs("div", { className: "flex items-center gap-2 p-3 border-t", children: [_jsx(Input, { placeholder: 'Type a message\u2026', value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter')
                                        onSend(); }, disabled: busy }), _jsx(Button, { onClick: onSend, disabled: busy, children: _jsx(Send, { className: "h-4 w-4" }) })] })] })] })) }));
}
