import { AlertCircle, Bell, Calendar, User } from "lucide-react";

export function getNotificationIcon(type) {
  switch (type) {
    case "task_assigned":
      return <User className="h-4 w-4 text-blue-500" />;
    case "task_due":
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case "project_update":
      return <AlertCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export function getNotificationColor(type) {
  switch (type) {
    case "task_assigned":
      return "border-l-blue-500";
    case "task_due":
      return "border-l-orange-500";
    case "project_update":
      return "border-l-green-500";
    default:
      return "border-l-gray-500";
  }
}

export function formatNotificationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return "Yesterday";
  return date.toLocaleDateString();
}
