import { useNavigate } from "react-router-dom";
import { createElement } from "react";
import { toast } from "sonner";
import { ShortcutHelpContent } from "@/components/shortcuts/shortcutHelpContent";

export function useShortcutActions({
  onNewTask,
  onNewProject,
  onSearch,
  onRefresh,
}) {
  const navigate = useNavigate();

  return {
    goDashboard: () => {
      navigate("/dashboard");
      toast.success("Navigated to Dashboard");
    },
    goProjects: () => {
      navigate("/projects");
      toast.success("Navigated to Projects");
    },
    goTasks: () => {
      navigate("/tasks");
      toast.success("Navigated to Tasks");
    },
    goTeam: () => {
      navigate("/team");
      toast.success("Navigated to Team");
    },
    goAnalytics: () => {
      navigate("/analytics");
      toast.success("Navigated to Analytics");
    },
    goNotifications: () => {
      navigate("/notifications");
      toast.success("Navigated to Notifications");
    },
    newTask: () =>
      onNewTask && (onNewTask(), toast.success("New Task dialog opened")),
    newProject: () =>
      onNewProject &&
      (onNewProject(), toast.success("New Project dialog opened")),
    search: () => onSearch && (onSearch(), toast.success("Search opened")),
    refresh: () => onRefresh && (onRefresh(), toast.success("Data refreshed")),
    help: () =>
      toast.info(createElement(ShortcutHelpContent), { duration: 8000 }),
  };
}
