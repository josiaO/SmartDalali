import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search, Send } from "lucide-react";
import communicationsService from "@/services/communications";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: { id: number; username: string };
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    username: string;
  }>;
  created_at: string;
  updated_at: string;
}

export function AgentMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const response = await communicationsService.fetchConversationMessages(conversationId);
      const msgs = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setSelectedMessages(msgs);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await communicationsService.fetchConversations();
      const convs = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setConversations(convs);
      if (convs.length > 0) {
        setSelectedConversation(convs[0]);
        await fetchMessages(convs[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await fetchMessages(conv.id);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      await communicationsService.sendConversationMessage(selectedConversation.id, {
        content: messageText,
      });

      await fetchMessages(selectedConversation.id);
      setMessageText("");
      toast({ title: "Success", description: "Message sent" });
    } catch (err) {
      console.error("Failed to send message:", err);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participants.some((p) => p?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const otherParticipant = selectedConversation?.participants.find(
    (p) => p?.id !== user?.id
  );

  return (
    <div className="h-screen flex gap-4 md:ml-64 p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Conversations List */}
      <Card className="hidden md:flex flex-col w-80 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </CardTitle>
          <CardDescription>Your agent messages</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded" />
                ))}
              </>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedConversation?.id === conv.id
                      ? "bg-primary/10 border border-primary/50"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="font-medium text-sm">
                    {conv.participants.map((p) => p?.username || "Unknown").join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    Latest message
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages View */}
      <Card className="flex-1 border-border/50 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat with {otherParticipant?.username || "User"}</CardTitle>
                  <CardDescription>
                    Started {new Date(selectedConversation.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge>{selectedMessages.length} messages</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {selectedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender.id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender.id === user?.id
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-muted-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="border-t p-4 flex gap-2">
              <Textarea
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="resize-none h-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                size="icon"
                className="h-12"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
