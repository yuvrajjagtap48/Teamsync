import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatNotificationDate,
  getNotificationColor,
  getNotificationIcon,
} from "./notificationUtils";

export function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  const isUnread = !notification.read;

  return (
    <Card
      className={`border-l-4 ${getNotificationColor(notification.type)} ${isUnread ? "bg-blue-50/50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-1">{getNotificationIcon(notification.type)}</div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                {isUnread && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
              <p className="mb-2 text-sm text-muted-foreground">
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatNotificationDate(notification.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(notification.id)}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
