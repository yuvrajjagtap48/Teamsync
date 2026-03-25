import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarNavigation({
  navigation,
  collapsed,
  unreadNotifications,
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50"
                  }
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                    {item.title === "Notifications" &&
                      unreadNotifications > 0 && (
                        <Badge
                          variant="destructive"
                          className="flex h-[18px] min-w-[18px] items-center justify-center px-1.5 py-0.5 text-xs"
                        >
                          {unreadNotifications > 99
                            ? "99+"
                            : unreadNotifications}
                        </Badge>
                      )}
                  </div>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
