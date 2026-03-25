import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PasswordField({ id, label, placeholder }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="password" placeholder={placeholder} />
    </div>
  );
}

export function SecuritySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>Manage your account security settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PasswordField
          id="current-password"
          label="Current Password"
          placeholder="Enter current password"
        />
        <PasswordField
          id="new-password"
          label="New Password"
          placeholder="Enter new password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm New Password"
          placeholder="Confirm new password"
        />
        <Button variant="outline">Update Password</Button>
      </CardContent>
    </Card>
  );
}
