import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function NotificationsEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
        <p className="text-center text-muted-foreground">
          You&apos;re all caught up! New notifications will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
