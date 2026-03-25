import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Plus, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
export function TeamChat({ children }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [message, setMessage] = useState('');
    const [channels, setChannels] = useState([]);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const { data: userChannels } = useQuery({
        queryKey: ['chat-channels'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chat_channels')
                .select(`
          *,
          channel_members!inner(user_id)
        `)
                .eq('channel_members.user_id', user?.id)
                .order('name');
            if (error)
                throw error;
            return data;
        },
        enabled: !!user,
    });
    const { data: channelMessages } = useQuery({
        queryKey: ['chat-messages', selectedChannel],
        queryFn: async () => {
            if (!selectedChannel)
                return [];
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
          *
        `)
                .eq('channel_id', selectedChannel)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            // Fetch profiles separately
            const userIds = [...new Set(data.map(m => m.user_id))];
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);
            const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
            return data.map(msg => ({
                ...msg,
                profiles: {
                    full_name: profilesMap.get(msg.user_id)?.full_name || 'Unknown',
                    avatar_url: profilesMap.get(msg.user_id)?.avatar_url || null,
                }
            }));
        },
        enabled: !!selectedChannel,
    });
    useEffect(() => {
        if (userChannels) {
            setChannels(userChannels);
            if (!selectedChannel && userChannels.length > 0) {
                setSelectedChannel(userChannels[0].id);
            }
        }
    }, [userChannels, selectedChannel]);
    useEffect(() => {
        if (channelMessages) {
            setMessages(channelMessages);
            scrollToBottom();
        }
    }, [channelMessages]);
    useEffect(() => {
        if (!selectedChannel)
            return;
        const channel = supabase
            .channel(`chat-${selectedChannel}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `channel_id=eq.${selectedChannel}`
        }, () => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannel] });
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChannel, queryClient]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const sendMessage = async () => {
        if (!message.trim() || !selectedChannel)
            return;
        const { error } = await supabase
            .from('chat_messages')
            .insert({
            channel_id: selectedChannel,
            user_id: user?.id,
            content: message.trim(),
            message_type: 'text',
        });
        if (error) {
            toast.error('Failed to send message');
            return;
        }
        setMessage('');
    };
    const createChannel = async (name) => {
        const { data, error } = await supabase
            .from('chat_channels')
            .insert({
            name: name.trim(),
            description: '',
            type: 'public',
            created_by: user?.id,
        })
            .select()
            .single();
        if (error) {
            toast.error('Failed to create channel');
            return;
        }
        // Add creator as member
        await supabase
            .from('channel_members')
            .insert({
            channel_id: data.id,
            user_id: user?.id,
        });
        toast.success('Channel created');
        queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    };
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    const selectedChannelData = channels.find(c => c.id === selectedChannel);
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Team Chat" }), _jsx(DialogDescription, { children: "Communicate with your team in real-time" })] }), _jsxs("div", { className: "flex h-[70vh]", children: [_jsx("div", { className: "w-64 border-r pr-4", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold", children: "Channels" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                        const name = prompt('Channel name:');
                                                        if (name)
                                                            createChannel(name);
                                                    }, children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx(ScrollArea, { className: "h-96", children: _jsx("div", { className: "space-y-1", children: channels.map((channel) => (_jsxs("div", { className: `flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedChannel === channel.id ? 'bg-primary/10 text-primary' : ''}`, onClick: () => setSelectedChannel(channel.id), children: [_jsx(Hash, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: channel.name })] }, channel.id))) }) })] }) }), _jsx("div", { className: "flex-1 flex flex-col", children: selectedChannelData ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "border-b p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Hash, { className: "h-5 w-5" }), _jsx("h2", { className: "font-semibold", children: selectedChannelData.name }), _jsx(Badge, { variant: "outline", className: "text-xs", children: selectedChannelData.type })] }), selectedChannelData.description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: selectedChannelData.description }))] }), _jsx(ScrollArea, { className: "flex-1 p-4", children: _jsxs("div", { className: "space-y-4", children: [messages.map((msg) => (_jsxs("div", { className: "flex gap-3", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: msg.profiles.avatar_url || '' }), _jsx(AvatarFallback, { className: "text-xs", children: getInitials(msg.profiles.full_name) })] }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "font-medium text-sm", children: msg.profiles.full_name }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) }), msg.edited && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "edited" }))] }), _jsx("p", { className: "text-sm", children: msg.content })] })] }, msg.id))), _jsx("div", { ref: messagesEndRef })] }) }), _jsx("div", { className: "border-t p-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: `Message #${selectedChannelData.name}`, value: message, onChange: (e) => setMessage(e.target.value), onKeyDown: (e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                sendMessage();
                                                            }
                                                        } }), _jsx(Button, { onClick: sendMessage, disabled: !message.trim(), children: _jsx(Send, { className: "h-4 w-4" }) })] }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-muted-foreground", children: "Select a channel to start chatting" })) })] })] })] }));
}
