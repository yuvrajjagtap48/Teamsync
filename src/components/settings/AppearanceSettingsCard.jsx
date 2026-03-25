import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function AppearanceSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize how TeamSync looks for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Light
            </Button>
            <Button variant="outline" className="flex-1">
              Dark
            </Button>
            <Button variant="default" className="flex-1">
              System
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
