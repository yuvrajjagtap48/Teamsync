import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

function SettingSwitch({ id, label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function NotificationSettingsCard({
  emailNotifications,
  setEmailNotifications,
  pushNotifications,
  setPushNotifications,
  taskReminders,
  setTaskReminders,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Configure how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingSwitch
          id="email-notifications"
          label="Email Notifications"
          description="Receive notifications via email"
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
        />
        <Separator />
        <SettingSwitch
          id="push-notifications"
          label="Push Notifications"
          description="Receive push notifications in your browser"
          checked={pushNotifications}
          onCheckedChange={setPushNotifications}
        />
        <Separator />
        <SettingSwitch
          id="task-reminders"
          label="Task Reminders"
          description="Get reminders for upcoming task deadlines"
          checked={taskReminders}
          onCheckedChange={setTaskReminders}
        />
      </CardContent>
    </Card>
  );
}
