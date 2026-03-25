import { Settings as SettingsIcon } from "lucide-react";

export function SettingsHeader() {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
        <SettingsIcon className="h-8 w-8" />
        Settings
      </h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings and preferences
      </p>
    </div>
  );
}
