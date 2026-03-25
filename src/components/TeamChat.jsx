import { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Plus, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
export function TeamChat({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { data: userChannels } = useQuery({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_channels")
        .select(
          `
          *,
          channel_members!inner(user_id)
        `,
        )
        .eq("channel_members.user_id", user?.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const { data: channelMessages } = useQuery({
    queryKey: ["chat-messages", selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          *
        `,
        )
        .eq("channel_id", selectedChannel)
        .order("created_at", {
          ascending: true,
        });
      if (error) throw error;
      // Fetch profiles separately
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]));
      return data.map((msg) => ({
        ...msg,
        profiles: {
          full_name: profilesMap.get(msg.user_id)?.full_name || "Unknown",
          avatar_url: profilesMap.get(msg.user_id)?.avatar_url || null,
        },
      }));
    },
    enabled: !!selectedChannel,
  });
  useEffect(() => {
    if (userChannels) {
      setChannels(userChannels);
      if (!selectedChannel && userChannels.length > 0) {
        setSelectedChannel(userChannels[0].id);
      }
    }
  }, [userChannels, selectedChannel]);
  useEffect(() => {
    if (channelMessages) {
      setMessages(channelMessages);
      scrollToBottom();
    }
  }, [channelMessages]);
  useEffect(() => {
    if (!selectedChannel) return;
    const channel = supabase
      .channel(`chat-${selectedChannel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${selectedChannel}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["chat-messages", selectedChannel],
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel, queryClient]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };
  const sendMessage = async () => {
    if (!message.trim() || !selectedChannel) return;
    const { error } = await supabase.from("chat_messages").insert({
      channel_id: selectedChannel,
      user_id: user?.id,
      content: message.trim(),
      message_type: "text",
    });
    if (error) {
      toast.error("Failed to send message");
      return;
    }
    setMessage("");
  };
  const createChannel = async (name) => {
    const { data, error } = await supabase
      .from("chat_channels")
      .insert({
        name: name.trim(),
        description: "",
        type: "public",
        created_by: user?.id,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create channel");
      return;
    }
    // Add creator as member
    await supabase.from("channel_members").insert({
      channel_id: data.id,
      user_id: user?.id,
    });
    toast.success("Channel created");
    queryClient.invalidateQueries({
      queryKey: ["chat-channels"],
    });
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  const selectedChannelData = channels.find((c) => c.id === selectedChannel);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={true}>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Team Chat</DialogTitle>
          <DialogDescription>
            Communicate with your team in real-time
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-[70vh]">
          <div className="w-64 border-r pr-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Channels</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const name = prompt("Channel name:");
                    if (name) createChannel(name);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <div
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedChannel === channel.id ? "bg-primary/10 text-primary" : ""}`}
                      onClick={() => setSelectedChannel(channel.id)}
                      key={channel.id}
                    >
                      <Hash className="h-4 w-4" />
                      <span className="text-sm">{channel.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            {selectedChannelData ? (
              <_Fragment>
                <div className="border-b p-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    <h2 className="font-semibold">
                      {selectedChannelData.name}
                    </h2>
                    <Badge variant="outline" className="text-xs">
                      {selectedChannelData.type}
                    </Badge>
                  </div>
                  {selectedChannelData.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedChannelData.description}
                    </p>
                  )}
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div className="flex gap-3" key={msg.id}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.profiles.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(msg.profiles.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {msg.profiles.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {msg.edited && (
                              <Badge variant="outline" className="text-xs">
                                edited
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Message #${selectedChannelData.name}`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </_Fragment>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a channel to start chatting
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
