import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Crown, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function Admin() {
    const { user } = useAuth();
    const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          id,
          full_name,
          avatar_url,
          created_at,
          user_roles (role)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
        enabled: isAdmin,
    });
    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, newRole }) => {
            // First, delete existing roles for this user
            const { error: deleteError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId);
            if (deleteError)
                throw deleteError;
            // Then insert the new role
            const { error: insertError } = await supabase
                .from('user_roles')
                .insert({ user_id: userId, role: newRole });
            if (insertError)
                throw insertError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({
                title: 'Success',
                description: 'User role updated successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: 'Failed to update user role',
                variant: 'destructive',
            });
            console.error('Role update error:', error);
        },
    });
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return _jsx(Crown, { className: "w-4 h-4" });
            case 'manager':
                return _jsx(Shield, { className: "w-4 h-4" });
            default:
                return _jsx(User, { className: "w-4 h-4" });
        }
    };
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'admin':
                return 'destructive';
            case 'manager':
                return 'default';
            default:
                return 'secondary';
        }
    };
    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };
    if (roleLoading || isLoading) {
        return (_jsx(DashboardLayout, { children: _jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) }));
    }
    if (!isAdmin) {
        return (_jsx(DashboardLayout, { children: _jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Card, { className: "max-w-md", children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Access Denied" }), _jsx(CardDescription, { children: "You don't have permission to access this page." })] }) }) }) }));
    }
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: "User Management" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Manage users and their roles across the system" })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "All Users" }), _jsx(CardDescription, { children: "View and manage user roles and permissions" })] }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "Email" }), _jsx(TableHead, { children: "Current Role" }), _jsx(TableHead, { children: "Joined" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: users?.map((userItem) => {
                                            const currentRole = userItem.user_roles?.[0]?.role || 'team_member';
                                            return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Avatar, { children: [_jsx(AvatarImage, { src: userItem.avatar_url || '' }), _jsx(AvatarFallback, { children: getInitials(userItem.full_name) })] }), _jsx("span", { className: "font-medium", children: userItem.full_name })] }) }), _jsx(TableCell, { className: "text-muted-foreground", children: userItem.id }), _jsx(TableCell, { children: _jsxs(Badge, { variant: getRoleBadgeVariant(currentRole), className: "flex items-center gap-1 w-fit", children: [getRoleIcon(currentRole), currentRole.replace('_', ' ')] }) }), _jsx(TableCell, { className: "text-muted-foreground", children: new Date(userItem.created_at).toLocaleDateString() }), _jsx(TableCell, { children: _jsxs(Select, { value: currentRole, onValueChange: (value) => updateRoleMutation.mutate({
                                                                userId: userItem.id,
                                                                newRole: value,
                                                            }), disabled: userItem.id === user?.id, children: [_jsx(SelectTrigger, { className: "w-[140px]", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "team_member", children: "Team Member" }), _jsx(SelectItem, { value: "manager", children: "Manager" }), _jsx(SelectItem, { value: "admin", children: "Admin" })] })] }) })] }, userItem.id));
                                        }) })] }) })] })] }) }));
}
