import {
  BarChart3,
  Bell,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";

const baseNavigation = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Team", url: "/team", icon: Users },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const adminNavigation = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function getNavigation(isAdmin) {
  return isAdmin ? [...baseNavigation, ...adminNavigation] : baseNavigation;
}
