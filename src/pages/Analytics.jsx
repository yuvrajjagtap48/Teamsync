import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Target,
  Activity,
} from "lucide-react";
import { format, subDays } from "date-fns";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedProject, setSelectedProject] = useState("all");
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;
      return data;
    },
  });
  const { data: tasks } = useQuery({
    queryKey: ["tasks-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          projects:project_id(title, status),
          assignee:assigned_to(full_name)
        `,
        )
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;
      return data;
    },
  });
  const { data: teamMembers } = useQuery({
    queryKey: ["profiles-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select(`
          *,
          user_roles(role)
        `);
      if (error) throw error;
      return data;
    },
  });
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "7d":
        return {
          start: subDays(now, 7),
          end: now,
        };
      case "30d":
        return {
          start: subDays(now, 30),
          end: now,
        };
      case "90d":
        return {
          start: subDays(now, 90),
          end: now,
        };
      default:
        return {
          start: subDays(now, 7),
          end: now,
        };
    }
  };
  const filteredTasks =
    tasks?.filter((task) => {
      const taskDate = new Date(task.created_at);
      const { start, end } = getDateRange();
      if (selectedProject !== "all") {
        return (
          task.project_id === selectedProject &&
          taskDate >= start &&
          taskDate <= end
        );
      }
      return taskDate >= start && taskDate <= end;
    }) || [];
  const getTaskStatusData = () => {
    const statusCounts = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    return [
      {
        name: "To Do",
        value: statusCounts.todo || 0,
        color: "#94A3B8",
      },
      {
        name: "In Progress",
        value: statusCounts.in_progress || 0,
        color: "#3B82F6",
      },
      {
        name: "Review",
        value: statusCounts.review || 0,
        color: "#F59E0B",
      },
      {
        name: "Done",
        value: statusCounts.done || 0,
        color: "#10B981",
      },
    ];
  };
  const getPriorityData = () => {
    const priorityCounts = filteredTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    return [
      {
        name: "Low",
        value: priorityCounts.low || 0,
        color: "#6B7280",
      },
      {
        name: "Medium",
        value: priorityCounts.medium || 0,
        color: "#3B82F6",
      },
      {
        name: "High",
        value: priorityCounts.high || 0,
        color: "#F59E0B",
      },
      {
        name: "Urgent",
        value: priorityCounts.urgent || 0,
        color: "#EF4444",
      },
    ];
  };
  const getProjectProgressData = () => {
    return (
      projects?.map((project) => ({
        name: project.title,
        progress: project.progress,
        tasks:
          tasks?.filter((task) => task.project_id === project.id).length || 0,
        completed:
          tasks?.filter(
            (task) => task.project_id === project.id && task.status === "done",
          ).length || 0,
      })) || []
    );
  };
  const getTaskTrendData = () => {
    const { start, end } = getDateRange();
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const trendData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dayTasks =
        tasks?.filter((task) => {
          const taskDate = new Date(task.created_at);
          return taskDate.toDateString() === date.toDateString();
        }) || [];
      trendData.push({
        date: format(date, "MMM dd"),
        created: dayTasks.length,
        completed: dayTasks.filter((task) => task.status === "done").length,
      });
    }
    return trendData;
  };
  const getTeamProductivityData = () => {
    const memberStats =
      teamMembers?.map((member) => {
        const memberTasks =
          tasks?.filter((task) => task.assigned_to === member.id) || [];
        const completedTasks = memberTasks.filter(
          (task) => task.status === "done",
        ).length;
        return {
          name: member.full_name,
          total: memberTasks.length,
          completed: completedTasks,
          productivity:
            memberTasks.length > 0
              ? (completedTasks / memberTasks.length) * 100
              : 0,
        };
      }) || [];
    return memberStats.sort((a, b) => b.productivity - a.productivity);
  };
  const getOverdueTasks = () => {
    const now = new Date();
    return (
      tasks?.filter(
        (task) =>
          task.due_date &&
          new Date(task.due_date) < now &&
          task.status !== "done",
      ) || []
    );
  };
  const getUpcomingDeadlines = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (
      tasks?.filter(
        (task) =>
          task.due_date &&
          new Date(task.due_date) > now &&
          new Date(task.due_date) <= nextWeek &&
          task.status !== "done",
      ) || []
    );
  };
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "done",
  ).length;
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const overdueTasks = getOverdueTasks().length;
  const upcomingDeadlines = getUpcomingDeadlines().length;
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>
            <p className="text-muted-foreground">
              Track project performance and team productivity
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {filteredTasks.length} in selected period
              </p>
              <Progress value={100} className="mt-2 h-1" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(completionRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {completedTasks} of {totalTasks} completed
              </p>
              <Progress value={completionRate} className="mt-2 h-1" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Tasks
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overdueTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                Need immediate attention
              </p>
              {overdueTasks > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Action Required
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Deadlines
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {upcomingDeadlines}
              </div>
              <p className="text-xs text-muted-foreground">Due within 7 days</p>
              {upcomingDeadlines > 0 && (
                <Badge
                  variant="outline"
                  className="mt-2 text-orange-600 border-orange-600"
                >
                  Plan Ahead
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                  <CardDescription>Current status of all tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  {totalTasks === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <Activity className="h-12 w-12 mb-2 opacity-20" />
                      <p>No tasks to display</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getTaskStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            percent > 0
                              ? `${name} ${(percent * 100).toFixed(0)}%`
                              : ""
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getTaskStatusData().map((entry, index) => (
                            <Cell fill={entry.color} key={`cell-${index}`} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                  <CardDescription>Task priorities breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPriorityData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {getPriorityData().map((entry, index) => (
                          <Cell fill={entry.color} key={`cell-${index}`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="projects" className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>
                  Progress and task counts for each project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!projects || projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <Target className="h-12 w-12 mb-2 opacity-20" />
                    <p>No projects to analyze</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getProjectProgressData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="progress"
                        fill="#8884d8"
                        name="Progress %"
                      />
                      <Bar dataKey="tasks" fill="#82ca9d" name="Total Tasks" />
                      <Bar
                        dataKey="completed"
                        fill="#ffc658"
                        name="Completed Tasks"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team" className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Team Productivity</CardTitle>
                <CardDescription>
                  Task completion rates by team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTeamProductivityData().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No team productivity data available</p>
                    </div>
                  ) : (
                    getTeamProductivityData().map((member, index) => (
                      <div
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        key={index}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.completed} of {member.total} tasks
                              completed
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {Math.round(member.productivity)}%
                            </div>
                            <Progress
                              value={member.productivity}
                              className="w-24 h-2"
                            />
                          </div>
                          {member.productivity >= 80 && (
                            <Badge variant="default" className="bg-green-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              High
                            </Badge>
                          )}
                          {member.productivity < 50 && member.total > 0 && (
                            <Badge
                              variant="outline"
                              className="text-orange-500"
                            >
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Low
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Task Trends</CardTitle>
                <CardDescription>
                  Task creation and completion over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!tasks || tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <Activity className="h-12 w-12 mb-2 opacity-20" />
                    <p>No trend data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={getTaskTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Tasks Created"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Tasks Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
