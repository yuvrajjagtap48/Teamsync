import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationsHeader({ unreadCount, onMarkAllAsRead }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with project activities
        </p>
      </div>
      {unreadCount > 0 && (
        <Button variant="outline" onClick={onMarkAllAsRead}>
          <Check className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      )}
    </div>
  );
}
