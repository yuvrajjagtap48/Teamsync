import { MessageCircle, Search } from "lucide-react";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { TeamChat } from "@/components/TeamChat";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarQuickActions({ collapsed }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <AdvancedSearch>
              <SidebarMenuButton className="w-full">
                <Search className="h-4 w-4" />
                {!collapsed && <span>Search</span>}
              </SidebarMenuButton>
            </AdvancedSearch>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <TeamChat>
              <SidebarMenuButton className="w-full">
                <MessageCircle className="h-4 w-4" />
                {!collapsed && <span>Chat</span>}
              </SidebarMenuButton>
            </TeamChat>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
