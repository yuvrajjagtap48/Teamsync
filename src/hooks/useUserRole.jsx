import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
export function useUserRole(userId) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        const fetchRoles = async () => {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId);
            if (!error && data) {
                setRoles(data.map(r => r.role));
            }
            setLoading(false);
        };
        fetchRoles();
    }, [userId]);
    const hasRole = (role) => roles.includes(role);
    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    return {
        roles,
        loading,
        hasRole,
        isAdmin,
        isManager,
    };
}
