import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Calendar,
  User,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";
export function AdvancedSearch({ children, onResultSelect }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    type: "all",
    status: "",
    priority: "",
    assignee: "",
    project: "",
    dateRange: "",
    tags: [],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchUsers();
    }
  }, [open]);
  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("title");
    if (error) {
      console.error("Error fetching projects:", error);
      return;
    }
    setProjects(data || []);
  };
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    setUsers(data || []);
  };
  const performSearch = async () => {
    if (!filters.query.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setLoading(true);
    try {
      const searchResults = [];
      // Search tasks
      if (filters.type === "all" || filters.type === "tasks") {
        let taskQuery = supabase
          .from("tasks")
          .select(
            `
            *,
            projects:project_id(title, status),
            assignee:assigned_to(full_name, avatar_url),
            creator:created_by(full_name, avatar_url)
          `,
          )
          .or(
            `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`,
          );
        if (filters.status) {
          taskQuery = taskQuery.eq("status", filters.status);
        }
        if (filters.priority) {
          taskQuery = taskQuery.eq("priority", filters.priority);
        }
        if (filters.assignee) {
          taskQuery = taskQuery.eq("assigned_to", filters.assignee);
        }
        if (filters.project) {
          taskQuery = taskQuery.eq("project_id", filters.project);
        }
        const { data: tasks, error: tasksError } = await taskQuery;
        if (tasksError) throw tasksError;
        searchResults.push(
          ...(tasks || []).map((task) => ({
            ...task,
            type: "task",
            searchableText:
              `${task.title} ${task.description || ""}`.toLowerCase(),
          })),
        );
      }
      // Search projects
      if (filters.type === "all" || filters.type === "projects") {
        let projectQuery = supabase
          .from("projects")
          .select("*")
          .or(
            `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`,
          );
        if (filters.status) {
          projectQuery = projectQuery.eq("status", filters.status);
        }
        const { data: projects, error: projectsError } = await projectQuery;
        if (projectsError) throw projectsError;
        searchResults.push(
          ...(projects || []).map((project) => ({
            ...project,
            type: "project",
            searchableText:
              `${project.title} ${project.description || ""}`.toLowerCase(),
          })),
        );
      }
      // Search users
      if (filters.type === "all" || filters.type === "users") {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .ilike("full_name", `%${filters.query}%`);
        if (profilesError) throw profilesError;
        searchResults.push(
          ...(profiles || []).map((profile) => ({
            ...profile,
            type: "user",
            searchableText: profile.full_name.toLowerCase(),
          })),
        );
      }
      // Filter by date range
      if (filters.dateRange) {
        const now = new Date();
        let startDate;
        switch (filters.dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        const filteredResults = searchResults.filter((result) => {
          const resultDate = new Date(result.created_at);
          return resultDate >= startDate;
        });
        setResults(filteredResults);
      } else {
        setResults(searchResults);
      }
    } catch (error) {
      toast.error("Search failed");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  const getResultIcon = (type) => {
    switch (type) {
      case "task":
        return CheckSquare;
      case "project":
        return FolderKanban;
      case "user":
        return User;
      default:
        return Search;
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-purple-100 text-purple-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={true}>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
          <DialogDescription>
            Search across tasks, projects, and team members with advanced
            filters
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for tasks, projects, or people..."
              value={filters.query}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  query: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  performSearch();
                }
              }}
            />
            <Button onClick={performSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <Tabs defaultValue="filters" className="w-full">
            <TabsList>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="results">
                Results ({results.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="tasks">Tasks</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || "any"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        status: value === "any" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={filters.priority || "any"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        priority: value === "any" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select
                    value={filters.dateRange || "any"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        dateRange: value === "any" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select
                    value={filters.project || "any"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        project: value === "any" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem value={project.id} key={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={filters.assignee || "any"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        assignee: value === "any" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any assignee</SelectItem>
                      {users.map((user) => (
                        <SelectItem value={user.id} key={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="results" className="space-y-4">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No results found. Try adjusting your search criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result, index) => {
                      const Icon = getResultIcon(result.type);
                      return (
                        <Card
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          key={`${result.type}-${result.id}-${index}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">
                                    {result.title || result.full_name}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {result.type}
                                  </Badge>
                                  {result.status && (
                                    <Badge
                                      className={`text-xs ${getStatusColor(result.status)}`}
                                    >
                                      {result.status.replace("_", " ")}
                                    </Badge>
                                  )}
                                  {result.priority && (
                                    <Badge
                                      className={`text-xs ${getPriorityColor(result.priority)}`}
                                    >
                                      {result.priority}
                                    </Badge>
                                  )}
                                </div>
                                {result.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {result.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(
                                      new Date(result.created_at),
                                      "MMM dd, yyyy",
                                    )}
                                  </div>
                                  {result.type === "task" &&
                                    result.assignee && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {result.assignee.full_name}
                                      </div>
                                    )}
                                  {result.type === "task" &&
                                    result.projects && (
                                      <div className="flex items-center gap-1">
                                        <FolderKanban className="h-3 w-3" />
                                        {result.projects.title}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
