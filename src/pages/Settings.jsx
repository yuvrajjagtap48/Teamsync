import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppearanceSettingsCard } from "@/components/settings/AppearanceSettingsCard";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";
import { SecuritySettingsCard } from "@/components/settings/SecuritySettingsCard";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SystemSettingsCard } from "@/components/settings/SystemSettingsCard";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SettingsHeader />
        <NotificationSettingsCard
          emailNotifications={emailNotifications}
          setEmailNotifications={setEmailNotifications}
          pushNotifications={pushNotifications}
          setPushNotifications={setPushNotifications}
          taskReminders={taskReminders}
          setTaskReminders={setTaskReminders}
        />
        <SecuritySettingsCard />
        <AppearanceSettingsCard />
        {isAdmin && <SystemSettingsCard />}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} size="lg">
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
