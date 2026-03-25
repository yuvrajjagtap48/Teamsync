import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, Check, Trash2, Calendar, User, AlertCircle } from 'lucide-react';
export default function Notifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
        enabled: !!user,
    });
    useEffect(() => {
        if (!user)
            return;
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
        }, () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);
    const markAsRead = async (notificationId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        if (error) {
            toast.error('Failed to mark notification as read');
            return;
        }
        refetch();
    };
    const deleteNotification = async (notificationId) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
        if (error) {
            toast.error('Failed to delete notification');
            return;
        }
        refetch();
    };
    const markAllAsRead = async () => {
        const unreadNotifications = notifications?.filter(n => !n.read) || [];
        for (const notification of unreadNotifications) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notification.id);
        }
        refetch();
    };
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'task_assigned':
                return _jsx(User, { className: "h-4 w-4 text-blue-500" });
            case 'task_due':
                return _jsx(Calendar, { className: "h-4 w-4 text-orange-500" });
            case 'project_update':
                return _jsx(AlertCircle, { className: "h-4 w-4 text-green-500" });
            default:
                return _jsx(Bell, { className: "h-4 w-4 text-gray-500" });
        }
    };
    const getNotificationColor = (type) => {
        switch (type) {
            case 'task_assigned':
                return 'border-l-blue-500';
            case 'task_due':
                return 'border-l-orange-500';
            case 'project_update':
                return 'border-l-green-500';
            default:
                return 'border-l-gray-500';
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1)
            return 'Just now';
        if (diffInHours < 24)
            return `${diffInHours}h ago`;
        if (diffInHours < 48)
            return 'Yesterday';
        return date.toLocaleDateString();
    };
    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Notifications" }), _jsx("p", { className: "text-muted-foreground", children: "Stay updated with project activities" })] }), unreadCount > 0 && (_jsxs(Button, { variant: "outline", onClick: markAllAsRead, children: [_jsx(Check, { className: "mr-2 h-4 w-4" }), "Mark all as read"] }))] }), isLoading ? (_jsx("div", { className: "text-muted-foreground", children: "Loading notifications..." })) : !notifications || notifications.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Bell, { className: "h-12 w-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: "No notifications" }), _jsx("p", { className: "text-muted-foreground text-center", children: "You're all caught up! New notifications will appear here." })] }) })) : (_jsx(ScrollArea, { className: "h-[600px]", children: _jsx("div", { className: "space-y-3", children: notifications.map((notification) => (_jsx(Card, { className: `border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-blue-50/50' : ''}`, children: _jsx(CardContent, { className: "p-4", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx("div", { className: "mt-1", children: getNotificationIcon(notification.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h4", { className: "font-medium text-sm", children: notification.title }), !notification.read && (_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full" }))] }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: notification.message }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: formatDate(notification.created_at) }), _jsxs("div", { className: "flex items-center gap-2", children: [!notification.read && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => markAsRead(notification.id), className: "h-6 px-2 text-xs", children: [_jsx(Check, { className: "h-3 w-3 mr-1" }), "Mark read"] })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => deleteNotification(notification.id), className: "h-6 px-2 text-xs text-red-600 hover:text-red-700", children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] })] })] }) }) }) }, notification.id))) }) })), unreadCount > 0 && (_jsx("div", { className: "flex items-center justify-center", children: _jsxs(Badge, { variant: "secondary", className: "text-sm", children: [unreadCount, " unread notification", unreadCount !== 1 ? 's' : ''] }) }))] }) }));
}
