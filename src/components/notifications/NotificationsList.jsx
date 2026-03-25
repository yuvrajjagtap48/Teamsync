import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";

export function NotificationsList({ notifications, onMarkAsRead, onDelete }) {
  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
