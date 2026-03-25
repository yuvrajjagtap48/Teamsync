import { Chrome, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthSocialButtons({ onOAuth }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" onClick={() => onOAuth("google")}>
        <Chrome className="mr-2 h-4 w-4" /> Google
      </Button>
      <Button type="button" variant="outline" onClick={() => onOAuth("github")}>
        <Github className="mr-2 h-4 w-4" /> GitHub
      </Button>
    </div>
  );
}
