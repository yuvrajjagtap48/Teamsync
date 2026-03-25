import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { SidebarBrand } from "./sidebar/SidebarBrand";
import { getNavigation } from "./sidebar/navigationConfig";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarQuickActions } from "./sidebar/SidebarQuickActions";
import { SidebarSignOut } from "./sidebar/SidebarSignOut";

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const collapsed = state === "collapsed";
  const navigation = getNavigation(isAdmin);

  const { data: unreadNotifications } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarBrand collapsed={collapsed} />
        <SidebarNavigation
          navigation={navigation}
          collapsed={collapsed}
          unreadNotifications={unreadNotifications ?? 0}
        />
        <SidebarQuickActions collapsed={collapsed} />
      </SidebarContent>
      <SidebarSignOut collapsed={collapsed} onSignOut={signOut} />
    </Sidebar>
  );
}
