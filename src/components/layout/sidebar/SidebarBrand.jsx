import { Rocket } from "lucide-react";

export function SidebarBrand({ collapsed }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="gradient-primary shadow-primary flex h-10 w-10 items-center justify-center rounded-xl">
          <Rocket className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-foreground">
            TeamSync
          </span>
        )}
      </div>
    </div>
  );
}
