import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useConversations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function Conversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');

  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedConversationId || 0);
  const sendMessage = useSendMessage();

  const conversationsList = Array.isArray(conversations) ? conversations : (conversations as any)?.results || [];

  const filteredConversations = conversationsList.filter((conv: any) => {
    if (!search) return true;

    const participantNames = conv.participants
      .map((p: any) => `${p.first_name} ${p.last_name}`.toLowerCase())
      .join(' ');

    return participantNames.includes(search.toLowerCase());
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: messageText.trim(),
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
    const f = firstName[0] ?? '';
    const l = lastName[0] ?? '';
    return `${f}${l}`.toUpperCase();
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Connect with agents and property owners
        </p>
      </div>

      <Card className="h-[calc(100vh-200px)]">
        <div className="grid md:grid-cols-[350px_1fr] h-full">
          {/* Conversations List */}
          <div className="border-r">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>

            <ScrollArea className="h-[calc(100%-120px)]">
              <div className="space-y-1 p-4 pt-0">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search ? 'No conversations found' : 'No messages yet'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const otherParticipant = conversation.participants && conversation.participants.length > 0 ? conversation.participants[0] : null;
                    const isSelected = selectedConversationId === conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg hover:bg-muted transition-colors',
                          isSelected && 'bg-muted'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {otherParticipant ? getInitials(otherParticipant.first_name, otherParticipant.last_name) : ''}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">
                                {otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : 'Unknown'}
                              </p>
                              {conversation.last_message && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(conversation.last_message.created_at), 'MMM d')}
                                </span>
                              )}
                            </div>

                            {conversation.last_message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.last_message.content}
                              </p>
                            )}

                            {conversation.last_message && !conversation.last_message.read && (
                              <Badge variant="default" className="mt-1">New</Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Messages Panel */}
          <div className="flex flex-col">
            {selectedConversationId ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">
                    {(() => {
                      const conv = conversationsList.find((c: any) => c.id === selectedConversationId);
                      const participant = conv?.participants && conv.participants.length > 0 ? conv.participants[0] : null;
                      return participant
                        ? `${participant.first_name} ${participant.last_name}`
                        : 'Conversation';
                    })()}
                  </CardTitle>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const messagesList = Array.isArray(messages) ? messages : (messages as any)?.results || [];
                        return messagesList.map((message: any) => {
                          const isOwn = message.sender === message.conversation; // Simplified - adjust based on actual user ID

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex',
                                isOwn ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  'max-w-[70%] rounded-lg p-3',
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                              >
                                <p className="text-sm">{message.content}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                  {format(new Date(message.created_at), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button type="submit" disabled={!messageText.trim() || sendMessage.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
