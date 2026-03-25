import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
export function KeyboardShortcuts({ onNewTask, onNewProject, onSearch, onRefresh }) {
    const navigate = useNavigate();
    // Navigation shortcuts
    useHotkeys('ctrl+d, cmd+d', () => {
        navigate('/dashboard');
        toast.success('Navigated to Dashboard');
    }, { preventDefault: true });
    useHotkeys('ctrl+p, cmd+p', () => {
        navigate('/projects');
        toast.success('Navigated to Projects');
    }, { preventDefault: true });
    useHotkeys('ctrl+t, cmd+t', () => {
        navigate('/tasks');
        toast.success('Navigated to Tasks');
    }, { preventDefault: true });
    useHotkeys('ctrl+u, cmd+u', () => {
        navigate('/team');
        toast.success('Navigated to Team');
    }, { preventDefault: true });
    useHotkeys('ctrl+a, cmd+a', () => {
        navigate('/analytics');
        toast.success('Navigated to Analytics');
    }, { preventDefault: true });
    useHotkeys('ctrl+n, cmd+n', () => {
        navigate('/notifications');
        toast.success('Navigated to Notifications');
    }, { preventDefault: true });
    // Action shortcuts
    useHotkeys('ctrl+shift+t, cmd+shift+t', () => {
        if (onNewTask) {
            onNewTask();
            toast.success('New Task dialog opened');
        }
    }, { preventDefault: true });
    useHotkeys('ctrl+shift+p, cmd+shift+p', () => {
        if (onNewProject) {
            onNewProject();
            toast.success('New Project dialog opened');
        }
    }, { preventDefault: true });
    useHotkeys('ctrl+k, cmd+k', () => {
        if (onSearch) {
            onSearch();
            toast.success('Search opened');
        }
    }, { preventDefault: true });
    useHotkeys('ctrl+r, cmd+r', () => {
        if (onRefresh) {
            onRefresh();
            toast.success('Data refreshed');
        }
    }, { preventDefault: true });
    // Global shortcuts
    useHotkeys('ctrl+/, cmd+/', () => {
        showShortcutsHelp();
    }, { preventDefault: true });
    const showShortcutsHelp = () => {
        toast.info(_jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("div", { className: "font-semibold", children: "Keyboard Shortcuts:" }), _jsx("div", { children: "Ctrl/Cmd + D - Dashboard" }), _jsx("div", { children: "Ctrl/Cmd + P - Projects" }), _jsx("div", { children: "Ctrl/Cmd + T - Tasks" }), _jsx("div", { children: "Ctrl/Cmd + U - Team" }), _jsx("div", { children: "Ctrl/Cmd + A - Analytics" }), _jsx("div", { children: "Ctrl/Cmd + N - Notifications" }), _jsx("div", { children: "Ctrl/Cmd + Shift + T - New Task" }), _jsx("div", { children: "Ctrl/Cmd + Shift + P - New Project" }), _jsx("div", { children: "Ctrl/Cmd + K - Search" }), _jsx("div", { children: "Ctrl/Cmd + R - Refresh" }), _jsx("div", { children: "Ctrl/Cmd + / - Show this help" })] }), { duration: 8000 });
    };
    return null; // This component doesn't render anything
}
// Hook for using keyboard shortcuts in components
export function useKeyboardShortcuts() {
    const navigate = useNavigate();
    const shortcuts = {
        // Navigation
        dashboard: () => navigate('/dashboard'),
        projects: () => navigate('/projects'),
        tasks: () => navigate('/tasks'),
        team: () => navigate('/team'),
        analytics: () => navigate('/analytics'),
        notifications: () => navigate('/notifications'),
        // Common actions
        refresh: () => window.location.reload(),
        search: () => {
            // Focus search input if available
            const searchInput = document.querySelector('input[placeholder*="search" i]');
            if (searchInput) {
                searchInput.focus();
            }
        },
    };
    return shortcuts;
}
