import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  CheckSquare,
  Square,
  Trash2,
  Edit,
  Search,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
const statusColumns = [
  {
    id: "todo",
    title: "To Do",
  },
  {
    id: "in_progress",
    title: "In Progress",
  },
  {
    id: "review",
    title: "Review",
  },
  {
    id: "done",
    title: "Done",
  },
];
const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};
export default function Tasks() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState("kanban");
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("title");
      if (error) throw error;
      return data;
    },
  });
  const {
    data: tasks,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          projects:project_id(title),
          assignee:assigned_to(full_name, avatar_url),
          creator:created_by(full_name, avatar_url)
        `,
        )
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;
      return data || [];
    },
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
  });
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAssignedTo("");
    setSelectedProject("");
  };
  const createTask = async () => {
    if (!title.trim() || !selectedProject) {
      toast.error("Title and project are required");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      project_id: selectedProject,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      assigned_to: assignedTo || null,
      created_by: user?.id,
      status: "todo",
    };
    const { error } = await supabase.from("tasks").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Task created");
    setOpen(false);
    resetForm();
    refetch();
  };
  const toggleTaskSelection = (taskId) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setSelectedTasks(next);
  };
  const selectAllTasks = () => {
    setSelectedTasks(new Set((tasks || []).map((t) => t.id)));
  };
  const clearSelection = () => setSelectedTasks(new Set());
  const bulkUpdateStatus = async (newStatus) => {
    if (selectedTasks.size === 0) return;
    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
      })
      .in("id", Array.from(selectedTasks));
    if (error) return toast.error("Failed to update tasks");
    toast.success(`Updated ${selectedTasks.size} task(s)`);
    clearSelection();
    refetch();
  };
  const bulkDeleteTasks = async () => {
    if (selectedTasks.size === 0) return;
    const { error } = await supabase
      .from("tasks")
      .delete()
      .in("id", Array.from(selectedTasks));
    if (error) return toast.error("Failed to delete tasks");
    toast.success(`Deleted ${selectedTasks.size} task(s)`);
    clearSelection();
    refetch();
  };
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description &&
          t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority =
        priorityFilter === "all" || t.priority === priorityFilter;
      const matchesProject =
        projectFilter === "all" || t.project_id === projectFilter;
      return matchesSearch && matchesPriority && matchesProject;
    });
  }, [tasks, searchQuery, priorityFilter, projectFilter]);
  const getTasksByStatus = (status) =>
    filteredTasks.filter((t) => t.status === status);
  const sortedTimelineTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [filteredTasks]);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Tasks</h1>
              <p className="text-muted-foreground">
                Manage tasks across all projects
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={selectedTasks.size === 0}
              >
                <Square className="mr-2 h-4 w-4" /> Deselect All
              </Button>
              <Button
                variant="outline"
                onClick={selectAllTasks}
                disabled={!tasks || tasks.length === 0}
              >
                <CheckSquare className="mr-2 h-4 w-4" /> Select All
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild={true}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to your project
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Task description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">Project</Label>
                      <Select
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects?.map((project) => (
                            <SelectItem value={project.id} key={project.id}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={priority}
                          onValueChange={(v) => setPriority(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignee">Assign To</Label>
                      <Select
                        value={assignedTo || "unassigned"}
                        onValueChange={(v) =>
                          setAssignedTo(v === "unassigned" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {profiles?.map((profile) => (
                            <SelectItem value={profile.id} key={profile.id}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTask}>Create Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Badge variant="secondary">
                {selectedTasks.size} task
                {selectedTasks.size > 1 ? "s" : ""} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus("in_progress")}
              >
                <Edit className="h-4 w-4 mr-2" /> Mark In Progress
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus("done")}
              >
                <CheckSquare className="h-4 w-4 mr-2" /> Mark Done
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDeleteTasks}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map((project) => (
                  <SelectItem value={project.id} key={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                <LayoutList className="h-4 w-4 mr-2" />
                Timeline
              </Button>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="text-muted-foreground">Loading tasks...</div>
        ) : viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusColumns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div className="space-y-4" key={column.id}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-3 min-h-[200px] p-2 border-2 border-dashed border-transparent rounded-lg">
                    {columnTasks.map((task) => (
                      <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        key={task.id}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {task.title}
                              </h4>
                              <Badge
                                className={`text-xs ${priorityColors[task.priority]}`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {task.assignee && (
                                  <div className="flex items-center gap-1">
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage
                                        src={task.assignee.avatar_url || ""}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(task.assignee.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{task.assignee.full_name}</span>
                                  </div>
                                )}
                              </div>
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(task.due_date)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {task.projects?.title || "Unknown Project"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => toggleTaskSelection(task.id)}
                              >
                                {selectedTasks.has(task.id) ? (
                                  <CheckSquare className="h-4 w-4 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">No tasks</CardTitle>
                          <CardDescription>
                            Drop or create tasks to get started
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTimelineTasks.map((task) => {
              const isOverdue =
                task.due_date && new Date(task.due_date) < new Date();
              const statusColor =
                task.status === "done"
                  ? "bg-green-100 border-green-300"
                  : task.status === "in_progress"
                    ? "bg-blue-100 border-blue-300"
                    : task.status === "review"
                      ? "bg-yellow-100 border-yellow-300"
                      : "bg-gray-100 border-gray-300";
              return (
                <Card
                  className={`hover:shadow-md transition-shadow ${statusColor} border-l-4`}
                  key={task.id}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {task.title}
                          </h4>
                          <Badge
                            className={`text-xs ${priorityColors[task.priority]}`}
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {task.projects?.title || "Unknown"}
                          </span>
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                                  src={task.assignee.avatar_url || ""}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(task.assignee.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{task.assignee.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.due_date && (
                          <div
                            className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.due_date)}</span>
                            {isOverdue && (
                              <Badge
                                variant="destructive"
                                className="text-xs ml-1"
                              >
                                Overdue
                              </Badge>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => toggleTaskSelection(task.id)}
                        >
                          {selectedTasks.has(task.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {sortedTimelineTasks.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No tasks found</CardTitle>
                  <CardDescription>
                    Try adjusting your search or filters.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
