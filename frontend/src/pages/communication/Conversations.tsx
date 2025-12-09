import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Send, MessageSquare, Paperclip, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useConversations';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function Conversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isConnected } = useChatWebSocket(selectedConversationId);
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedConversationId || 0, !isConnected);
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

    if ((!messageText.trim() && !selectedFile) || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: messageText.trim(),
        attachments: selectedFile ? [selectedFile] : undefined,
      });
      setMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
          <div className={cn(
            "border-r h-full flex flex-col",
            selectedConversationId ? "hidden md:flex" : "flex"
          )}>
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

            <ScrollArea className="flex-1">
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
          <div className={cn(
            "flex-col h-full",
            !selectedConversationId ? "hidden md:flex" : "flex"
          )}>
            {selectedConversationId ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b flex flex-row items-center gap-3 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <Search className="h-5 w-5 rotate-180" style={{ transform: 'none' }} />
                    <span className="sr-only">Back</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </Button>
                  <CardTitle className="text-lg m-0">
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
                          // TODO: Replace with actual user ID check
                          const isOwn = message.sender?.id === 'me' || message.sender === message.conversation; // 'me' is from optimistic update

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
                                    : 'bg-muted',
                                  message.isOptimistic && 'opacity-70'
                                )}
                              >
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mb-2">
                                    {message.attachments.map((att: any, idx: number) => (
                                      <div key={idx} className="bg-background/20 p-2 rounded text-xs flex items-center gap-2">
                                        <Paperclip className="h-3 w-3" />
                                        <span>Attachment</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center gap-1 justify-end mt-1">
                                  <span className="text-xs opacity-70">
                                    {format(new Date(message.created_at), 'h:mm a')}
                                  </span>
                                  {message.isOptimistic && <Loader2 className="h-3 w-3 animate-spin" />}
                                </div>
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
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">{selectedFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                        <span className="sr-only">Remove</span>
                        ×
                      </Button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    // accept="image/*,application/pdf" // Optional: restrict types if needed
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0"
                    >
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
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
                    <Button type="submit" disabled={(!messageText.trim() && !selectedFile) || sendMessage.isPending}>
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
