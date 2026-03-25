import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Shield, Crown, Users } from 'lucide-react';
const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    team_member: 'bg-gray-100 text-gray-800',
};
const roleIcons = {
    admin: Crown,
    manager: Shield,
    team_member: Users,
};
export default function Team() {
    const { user } = useAuth();
    const { isAdmin, isManager } = useUserRole(user?.id);
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('team_member');
    const { data: profiles, isLoading, refetch } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          *,
          user_roles(role)
        `)
                .order('full_name');
            if (error)
                throw error;
            return data;
        },
    });
    const { data: userRoles } = useQuery({
        queryKey: ['user-roles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_roles')
                .select('*');
            if (error)
                throw error;
            return data;
        },
    });
    const resetForm = () => {
        setEmail('');
        setRole('team_member');
    };
    const inviteUser = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        // Security: Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) {
            toast.error('Email is required');
            return;
        }
        if (!emailRegex.test(trimmedEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (trimmedEmail.length > 255) {
            toast.error('Email address is too long');
            return;
        }
        // Check if user already exists by querying profiles
        const { data: existingProfiles } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
        // For now, just send invitation (we can't check auth.users from client)
        const existingUser = null;
        // Send invitation (this would need to be done via an edge function in production)
        toast.info('User invitation feature requires backend implementation');
        toast.info(`Would invite ${trimmedEmail} with role: ${role}`);
        setOpen(false);
        resetForm();
        refetch();
    };
    const updateUserRole = async (userId, newRole) => {
        const { error } = await supabase
            .from('user_roles')
            .upsert({
            user_id: userId,
            role: newRole,
        });
        if (error) {
            toast.error('Failed to update role');
            return;
        }
        toast.success('Role updated successfully');
        refetch();
    };
    const removeUserRole = async (userId) => {
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);
        if (error) {
            toast.error('Failed to remove user');
            return;
        }
        toast.success('User removed successfully');
        refetch();
    };
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    const getUserRole = (userId) => {
        return userRoles?.find(ur => ur.user_id === userId)?.role || 'team_member';
    };
    const canManageUsers = isAdmin || isManager;
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Team" }), _jsx("p", { className: "text-muted-foreground", children: "Manage your team members and their roles" })] }), canManageUsers && (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Invite User"] }) }), _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Invite Team Member" }), _jsx(DialogDescription, { children: "Send an invitation to join your team" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "user@example.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "role", children: "Role" }), _jsxs(Select, { value: role, onValueChange: (v) => setRole(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "team_member", children: "Team Member" }), _jsx(SelectItem, { value: "manager", children: "Manager" }), isAdmin && _jsx(SelectItem, { value: "admin", children: "Admin" })] })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { onClick: inviteUser, children: "Send Invitation" })] })] })] }))] }), isLoading ? (_jsx("div", { className: "text-muted-foreground", children: "Loading team members..." })) : !profiles || profiles.length === 0 ? (_jsx(Card, { children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "No team members" }), _jsx(CardDescription, { children: "Start by inviting team members to collaborate on projects." })] }) })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: profiles.map((profile) => {
                        const userRole = getUserRole(profile.id);
                        const RoleIcon = roleIcons[userRole];
                        const isCurrentUser = profile.id === user?.id;
                        return (_jsx(Card, { className: "hover:shadow-md transition-shadow", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Avatar, { className: "h-12 w-12", children: [_jsx(AvatarImage, { src: profile.avatar_url || '' }), _jsx(AvatarFallback, { children: getInitials(profile.full_name) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h3", { className: "font-semibold text-sm truncate", children: profile.full_name }), isCurrentUser && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "You" }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(RoleIcon, { className: "h-3 w-3 text-muted-foreground" }), _jsx(Badge, { className: `text-xs ${roleColors[userRole]}`, children: userRole.replace('_', ' ') })] })] })] }), canManageUsers && !isCurrentUser && (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Label, { className: "text-xs", children: "Role" }), _jsxs(Select, { value: userRole, onValueChange: (v) => updateUserRole(profile.id, v), children: [_jsx(SelectTrigger, { className: "h-7 text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "team_member", children: "Team Member" }), _jsx(SelectItem, { value: "manager", children: "Manager" }), isAdmin && _jsx(SelectItem, { value: "admin", children: "Admin" })] })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => removeUserRole(profile.id), className: "w-full h-7 text-xs text-red-600 hover:text-red-700", children: "Remove User" })] }))] }) }, profile.id));
                    }) })), canManageUsers && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Team Statistics" }), _jsx(CardDescription, { children: "Overview of your team composition" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: profiles?.filter(p => getUserRole(p.id) === 'admin').length || 0 }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Admins" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: profiles?.filter(p => getUserRole(p.id) === 'manager').length || 0 }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Managers" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-600", children: profiles?.filter(p => getUserRole(p.id) === 'team_member').length || 0 }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Team Members" })] })] }) })] }))] }) }));
}
