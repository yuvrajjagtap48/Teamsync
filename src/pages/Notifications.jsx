import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsEmpty } from "@/components/notifications/NotificationsEmpty";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { useNotificationsData } from "@/hooks/notifications/useNotificationsData";

export default function Notifications() {
  const { user } = useAuth();
  const {
    data: notifications,
    isLoading,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotificationsData(user?.id);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NotificationsHeader
          unreadCount={unreadCount}
          onMarkAllAsRead={markAllAsRead}
        />

        {isLoading ? (
          <div className="text-muted-foreground">Loading notifications...</div>
        ) : !notifications || notifications.length === 0 ? (
          <NotificationsEmpty />
        ) : (
          <NotificationsList
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        )}

        {unreadCount > 0 && (
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
