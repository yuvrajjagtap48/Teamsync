import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Play, Square, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatTimerValue(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function TimeTracker({ taskId }) {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");

  const { data: timeEntries, refetch } = useQuery({
    queryKey: ["time-entries", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("task_id", taskId)
        .order("start_time", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map((entry) => entry.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(
        profilesData?.map((profile) => [profile.id, profile]),
      );
      return data.map((entry) => ({
        ...entry,
        profiles: profilesMap.get(entry.user_id)
          ? { full_name: profilesMap.get(entry.user_id).full_name }
          : undefined,
      }));
    },
  });

  const { data: activeEntry } = useQuery({
    queryKey: ["active-time-entry", taskId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("task_id", taskId)
        .eq("user_id", user?.id)
        .is("end_time", null)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!activeEntry) {
      setIsRunning(false);
      setCurrentEntry(null);
      return;
    }

    setIsRunning(true);
    setCurrentEntry(activeEntry);
    setDescription(activeEntry.description || "");
  }, [activeEntry]);

  useEffect(() => {
    if (!isRunning || !currentEntry) return undefined;

    const interval = setInterval(() => {
      const startTime = new Date(currentEntry.start_time).getTime();
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentEntry, isRunning]);

  const startTimer = async () => {
    if (!description.trim()) return toast.error("Please enter a description");

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        task_id: taskId,
        user_id: user?.id,
        description: description.trim(),
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return toast.error("Failed to start timer");

    setCurrentEntry(data);
    setIsRunning(true);
    setElapsedTime(0);
    toast.success("Timer started");
    refetch();
  };

  const stopTimer = async () => {
    if (!currentEntry) return;

    const { error } = await supabase
      .from("time_entries")
      .update({ end_time: new Date().toISOString() })
      .eq("id", currentEntry.id);

    if (error) return toast.error("Failed to stop timer");

    setIsRunning(false);
    setCurrentEntry(null);
    setElapsedTime(0);
    setDescription("");
    toast.success("Timer stopped");
    refetch();
  };

  const totalTime =
    timeEntries?.reduce(
      (total, entry) => total + (entry.duration_minutes || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What are you working on?"
                disabled={isRunning}
              />
            </div>
            <div className="flex items-center gap-3">
              {!isRunning ? (
                <Button onClick={startTimer} disabled={!description.trim()}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </Button>
              ) : (
                <Button onClick={stopTimer} variant="destructive">
                  <Square className="mr-2 h-4 w-4" />
                  Stop Timer
                </Button>
              )}
              {isRunning && (
                <div className="font-mono text-2xl font-bold text-primary">
                  {formatTimerValue(elapsedTime)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDuration(totalTime)}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDuration(totalTime)}
              </div>
              <div className="text-sm text-muted-foreground">Billable Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {timeEntries?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No time entries yet
                </div>
              ) : (
                timeEntries?.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{entry.description}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.profiles?.full_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.start_time), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.start_time), "HH:mm")}
                          {entry.end_time &&
                            ` - ${format(new Date(entry.end_time), "HH:mm")}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {entry.duration_minutes
                          ? formatDuration(entry.duration_minutes)
                          : "Running..."}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
