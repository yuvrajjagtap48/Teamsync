import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useNotificationsData(userId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () =>
          queryClient.invalidateQueries({
            queryKey: ["notifications", userId],
          }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const runMutation = async (action, failMessage) => {
    const { error } = await action();
    if (error) {
      toast.error(failMessage);
      return;
    }
    query.refetch();
  };

  const markAsRead = (id) =>
    runMutation(
      () => supabase.from("notifications").update({ read: true }).eq("id", id),
      "Failed to mark notification as read",
    );

  const deleteNotification = (id) =>
    runMutation(
      () => supabase.from("notifications").delete().eq("id", id),
      "Failed to delete notification",
    );

  const markAllAsRead = async () => {
    const unread = query.data?.filter((item) => !item.read) ?? [];
    await Promise.all(
      unread.map((item) =>
        supabase.from("notifications").update({ read: true }).eq("id", item.id),
      ),
    );
    query.refetch();
  };

  return { ...query, markAsRead, deleteNotification, markAllAsRead };
}
