import { useHotkeys } from "react-hotkeys-hook";
import { useShortcutActions } from "@/hooks/shortcuts/useShortcutActions";

export function KeyboardShortcuts({
  onNewTask,
  onNewProject,
  onSearch,
  onRefresh,
}) {
  const actions = useShortcutActions({
    onNewTask,
    onNewProject,
    onSearch,
    onRefresh,
  });

  useHotkeys("ctrl+d, cmd+d", actions.goDashboard, { preventDefault: true });
  useHotkeys("ctrl+p, cmd+p", actions.goProjects, { preventDefault: true });
  useHotkeys("ctrl+t, cmd+t", actions.goTasks, { preventDefault: true });
  useHotkeys("ctrl+u, cmd+u", actions.goTeam, { preventDefault: true });
  useHotkeys("ctrl+a, cmd+a", actions.goAnalytics, { preventDefault: true });
  useHotkeys("ctrl+n, cmd+n", actions.goNotifications, {
    preventDefault: true,
  });

  useHotkeys("ctrl+shift+t, cmd+shift+t", actions.newTask, {
    preventDefault: true,
  });
  useHotkeys("ctrl+shift+p, cmd+shift+p", actions.newProject, {
    preventDefault: true,
  });
  useHotkeys("ctrl+k, cmd+k", actions.search, { preventDefault: true });
  useHotkeys("ctrl+r, cmd+r", actions.refresh, { preventDefault: true });
  useHotkeys("ctrl+/, cmd+/", actions.help, { preventDefault: true });

  return null;
}
