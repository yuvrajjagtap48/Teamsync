import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  return {
    dashboard: () => navigate("/dashboard"),
    projects: () => navigate("/projects"),
    tasks: () => navigate("/tasks"),
    team: () => navigate("/team"),
    analytics: () => navigate("/analytics"),
    notifications: () => navigate("/notifications"),
    refresh: () => window.location.reload(),
    search: () => {
      const searchInput = document.querySelector(
        'input[placeholder*="search" i]',
      );
      if (searchInput) searchInput.focus();
    },
  };
}
