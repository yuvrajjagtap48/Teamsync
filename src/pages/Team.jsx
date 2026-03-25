import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Shield, Crown, Users } from "lucide-react";
const roleColors = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  team_member: "bg-gray-100 text-gray-800",
};
const roleIcons = {
  admin: Crown,
  manager: Shield,
  team_member: Users,
};
export default function Team() {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole(user?.id);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("team_member");
  const {
    data: profiles,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          user_roles(role)
        `,
        )
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });
  const resetForm = () => {
    setEmail("");
    setRole("team_member");
  };
  const inviteUser = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    // Security: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (trimmedEmail.length > 255) {
      toast.error("Email address is too long");
      return;
    }
    // Check if user already exists by querying profiles
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    // For now, just send invitation (we can't check auth.users from client)
    const existingUser = null;
    // Send invitation (this would need to be done via an edge function in production)
    toast.info("User invitation feature requires backend implementation");
    toast.info(`Would invite ${trimmedEmail} with role: ${role}`);
    setOpen(false);
    resetForm();
    refetch();
  };
  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase.from("user_roles").upsert({
      user_id: userId,
      role: newRole,
    });
    if (error) {
      toast.error("Failed to update role");
      return;
    }
    toast.success("Role updated successfully");
    refetch();
  };
  const removeUserRole = async (userId) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to remove user");
      return;
    }
    toast.success("User removed successfully");
    refetch();
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  const getUserRole = (userId) => {
    return (
      userRoles?.find((ur) => ur.user_id === userId)?.role || "team_member"
    );
  };
  const canManageUsers = isAdmin || isManager;
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team</h1>
            <p className="text-muted-foreground">
              Manage your team members and their roles
            </p>
          </div>
          {canManageUsers && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild={true}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team_member">Team Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        {isAdmin && (
                          <SelectItem value="admin">Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={inviteUser}>Send Invitation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading ? (
          <div className="text-muted-foreground">Loading team members...</div>
        ) : !profiles || profiles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No team members</CardTitle>
              <CardDescription>
                Start by inviting team members to collaborate on projects.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const userRole = getUserRole(profile.id);
              const RoleIcon = roleIcons[userRole];
              const isCurrentUser = profile.id === user?.id;
              return (
                <Card
                  className="hover:shadow-md transition-shadow"
                  key={profile.id}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {profile.full_name}
                          </h3>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-3 w-3 text-muted-foreground" />
                          <Badge className={`text-xs ${roleColors[userRole]}`}>
                            {userRole.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {canManageUsers && !isCurrentUser && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Role</Label>
                          <Select
                            value={userRole}
                            onValueChange={(v) => updateUserRole(profile.id, v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="team_member">
                                Team Member
                              </SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              {isAdmin && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUserRole(profile.id)}
                          className="w-full h-7 text-xs text-red-600 hover:text-red-700"
                        >
                          Remove User
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {canManageUsers && (
          <Card>
            <CardHeader>
              <CardTitle>Team Statistics</CardTitle>
              <CardDescription>
                Overview of your team composition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {profiles?.filter((p) => getUserRole(p.id) === "admin")
                      .length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Admins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {profiles?.filter((p) => getUserRole(p.id) === "manager")
                      .length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Managers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {profiles?.filter(
                      (p) => getUserRole(p.id) === "team_member",
                    ).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Team Members
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
