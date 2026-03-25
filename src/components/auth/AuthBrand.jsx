import { Rocket } from "lucide-react";

export function AuthBrand() {
  return (
    <div className="mb-8 text-center">
      <div className="gradient-primary shadow-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
        <Rocket className="h-8 w-8 text-white" />
      </div>
      <h1 className="mb-2 text-4xl font-bold">TeamSync</h1>
      <p className="text-muted-foreground">
        Collaborate, manage, and succeed together
      </p>
    </div>
  );
}
