import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  Flag,
  MessageSquare,
  Paperclip,
  Save,
  X,
  Edit3,
  Clock,
  CheckCircle,
} from "lucide-react";
import { FileUpload } from "./FileUpload";
import { TimeTracker } from "./TimeTracker";
const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};
const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
};
export function TaskDetailModal({ task, open, onOpenChange, onTaskUpdate }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [profiles, setProfiles] = useState([]);
  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
        assigned_to: task.assigned_to || "",
      });
    }
  }, [task]);
  useEffect(() => {
    if (open && task) {
      fetchComments();
      fetchProfiles();
    }
  }, [open, task]);
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("task_comments")
      .select(
        `
        *,
        profiles:user_id(full_name, avatar_url)
      `,
      )
      .eq("task_id", task.id)
      .order("created_at", {
        ascending: false,
      });
    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }
    setComments(data || []);
  };
  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }
    setProfiles(data || []);
  };
  const handleSave = async () => {
    const updates = {
      title: editedTask.title,
      description: editedTask.description || null,
      status: editedTask.status,
      priority: editedTask.priority,
      due_date: editedTask.due_date
        ? new Date(editedTask.due_date).toISOString()
        : null,
      assigned_to: editedTask.assigned_to || null,
    };
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task.id);
    if (error) {
      toast.error("Failed to update task");
      return;
    }
    toast.success("Task updated successfully");
    setIsEditing(false);
    onTaskUpdate();
  };
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from("task_comments").insert({
      task_id: task.id,
      user_id: user?.id,
      content: newComment.trim(),
    });
    if (error) {
      toast.error("Failed to add comment");
      return;
    }
    setNewComment("");
    fetchComments();
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  const getAssigneeName = () => {
    if (!task.assignee) return "Unassigned";
    return task.assignee.full_name;
  };
  const getAssigneeAvatar = () => {
    if (!task.assignee) return null;
    return task.assignee.avatar_url;
  };
  if (!task) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? "Edit Task" : "Task Details"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <_Fragment>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </_Fragment>
              )}
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold">{task.title}</h2>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <Badge className={statusColors[task.status]}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Description
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editedTask.description}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          description: e.target.value,
                        })
                      }
                      className="mt-2"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-2 text-sm">
                      {task.description || "No description provided"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Project
                  </Label>
                  <p className="mt-2 text-sm font-medium">
                    {task.projects?.title || "Unknown Project"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Assignee
                  </Label>
                  {isEditing ? (
                    <Select
                      value={editedTask.assigned_to || "unassigned"}
                      onValueChange={(value) =>
                        setEditedTask({
                          ...editedTask,
                          assigned_to: value === "unassigned" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem value={profile.id} key={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={getAssigneeAvatar() || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(getAssigneeName())}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getAssigneeName()}</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedTask.due_date}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          due_date: e.target.value,
                        })
                      }
                      className="mt-2"
                    />
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {task.due_date
                          ? formatDate(task.due_date)
                          : "No due date"}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  {isEditing ? (
                    <Select
                      value={editedTask.status}
                      onValueChange={(value) =>
                        setEditedTask({
                          ...editedTask,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-2">
                      <Badge className={statusColors[task.status]}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Priority
                  </Label>
                  {isEditing ? (
                    <Select
                      value={editedTask.priority}
                      onValueChange={(value) =>
                        setEditedTask({
                          ...editedTask,
                          priority: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-2">
                      <Badge className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Time Tracking</h3>
              </div>
              <TimeTracker taskId={task.id} />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Attachments</h3>
              </div>
              <FileUpload entityType="task" entityId={task.id} />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Comments</h3>
                <Badge variant="secondary" className="text-xs">
                  {comments.length}
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.profiles?.avatar_url || ""}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(comment.profiles?.full_name || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {comment.profiles?.full_name || "Unknown User"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
