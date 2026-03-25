import { Settings as SettingsIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SystemSettingsCard() {
  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Admin-only system configuration options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="max-users">Maximum Users</Label>
          <Input id="max-users" type="number" defaultValue="100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
          <Input id="session-timeout" type="number" defaultValue="60" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow User Registration</Label>
            <p className="text-sm text-muted-foreground">
              Enable new users to register accounts
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}
