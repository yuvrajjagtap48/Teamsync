import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  RefreshCcw,
  FileText,
  Users,
  UserPlus,
  X,
  Search,
} from "lucide-react";
import { ProjectTemplateSelector } from "@/components/ProjectTemplateSelector";
const statusVariants = {
  planning: {
    label: "Planning",
    variant: "secondary",
  },
  active: {
    label: "Active",
    variant: "default",
  },
  on_hold: {
    label: "On Hold",
    variant: "outline",
  },
  completed: {
    label: "Completed",
    variant: "secondary",
  },
};
export default function Projects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("planning");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const envReady = useMemo(
    () =>
      Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ),
    [],
  );
  const {
    data: projects,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          project_members(
            user_id,
            profiles:user_id(id, full_name, avatar_url)
          )
        `,
        )
        .order("updated_at", {
          ascending: false,
        });
      if (error) throw error;
      return data;
    },
    enabled: envReady && !!user,
  });
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: envReady && !!user,
  });
  useEffect(() => {
    if (!envReady) return;
    const ch = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["projects"],
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient, envReady]);
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setStatus("planning");
  };
  const createProject = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      manager_id: user?.id ?? null,
      progress: 0,
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: "", // will be ignored by Supabase
    };
    const { error } = await supabase.from("projects").insert({
      title: payload.title,
      description: payload.description,
      deadline: payload.deadline,
      manager_id: payload.manager_id,
      progress: payload.progress,
      status: payload.status,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project created");
    setOpen(false);
    resetForm();
    refetch();
  };
  const createProjectFromTemplate = async (template) => {
    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: template.name,
          description: template.description,
          manager_id: user?.id ?? null,
          progress: 0,
          status: "planning",
        })
        .select()
        .single();
      if (projectError) {
        toast.error("Failed to create project");
        return;
      }
      // Create tasks from template
      if (template.tasks && template.tasks.length > 0) {
        const tasksToInsert = template.tasks.map((task) => ({
          project_id: project.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: "todo",
          created_by: user?.id,
        }));
        const { error: tasksError } = await supabase
          .from("tasks")
          .insert(tasksToInsert);
        if (tasksError) {
          toast.error("Project created but failed to add tasks");
          return;
        }
      }
      toast.success("Project created from template successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to create project from template");
      console.error("Template project creation error:", error);
    }
  };
  const updateProject = async (id, updates) => {
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id);
    if (error) toast.error(error.message);
  };
  const addProjectMember = async (projectId, userId) => {
    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: userId,
    });
    if (error) {
      if (error.code === "23505") {
        toast.error("Member already added to project");
      } else {
        toast.error("Failed to add member");
      }
      return;
    }
    toast.success("Member added to project");
    refetch();
  };
  const removeProjectMember = async (projectId, userId) => {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to remove member");
      return;
    }
    toast.success("Member removed from project");
    refetch();
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description &&
          p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);
  if (!envReady) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Connect Supabase to manage projects.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Supabase not configured</CardTitle>
              <CardDescription>
                Provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY,
                then refresh. Use Open MCP popover to connect Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">
                Manage and track all your projects
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />{" "}
                Refresh
              </Button>
              <ProjectTemplateSelector
                onTemplateSelect={createProjectFromTemplate}
              >
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> From Template
                </Button>
              </ProjectTemplateSelector>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild={true}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
                    <DialogDescription>
                      Create a project with basic details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Website Redesign"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Goals, scope, and outcomes"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={status}
                          onValueChange={(v) => setStatus(v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="on_completed">
                              Completed
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createProject}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isLoading ? (
          <div className="text-muted-foreground">Loading projects...</div>
        ) : !projects || projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Click "New Project" to create your first project.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects found</CardTitle>
              <CardDescription>
                Try adjusting your search or filters.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const projectMembers = p.project_members || [];
              const memberIds = projectMembers.map((pm) => pm.user_id);
              const availableProfiles =
                profiles?.filter((prof) => !memberIds.includes(prof.id)) || [];
              return (
                <Card className="hover:shadow-md transition-smooth" key={p.id}>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{p.title}</CardTitle>
                      <Badge variant={statusVariants[p.status].variant}>
                        {statusVariants[p.status].label}
                      </Badge>
                    </div>
                    {p.description && (
                      <CardDescription className="line-clamp-2">
                        {p.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                      <Progress value={p.progress} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select
                          defaultValue={p.status}
                          onValueChange={(v) =>
                            updateProject(p.id, {
                              status: v,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Progress</Label>
                        <Slider
                          defaultValue={[p.progress]}
                          max={100}
                          step={5}
                          onValueCommit={(val) =>
                            updateProject(p.id, {
                              progress: val[0],
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Team Members ({projectMembers.length})
                        </Label>
                        {availableProfiles.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild={true}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Add Team Member</DialogTitle>
                                <DialogDescription>
                                  Select a team member to add to this project
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {availableProfiles.map((profile) => (
                                  <div
                                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                                    onClick={() =>
                                      addProjectMember(p.id, profile.id)
                                    }
                                    key={profile.id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={profile.avatar_url || ""}
                                        />
                                        <AvatarFallback className="text-xs">
                                          {getInitials(profile.full_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {profile.full_name}
                                      </span>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      Add
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {projectMembers.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No members assigned
                          </span>
                        ) : (
                          projectMembers.map((pm) => {
                            const profile = pm.profiles;
                            if (!profile) return null;
                            return (
                              <div className="group relative" key={pm.user_id}>
                                <Avatar className="h-7 w-7 border-2 border-background">
                                  <AvatarImage src={profile.avatar_url || ""} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(profile.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-md">
                                  {profile.full_name}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full"
                                  onClick={() =>
                                    removeProjectMember(p.id, pm.user_id)
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.deadline
                        ? `Due ${new Date(p.deadline).toLocaleDateString()}`
                        : "No deadline"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
