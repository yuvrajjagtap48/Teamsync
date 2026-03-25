import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";

export function SidebarSignOut({ collapsed, onSignOut }) {
  return (
    <SidebarFooter>
      <Button
        variant="ghost"
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={onSignOut}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span className="ml-2">Sign Out</span>}
      </Button>
    </SidebarFooter>
  );
}
