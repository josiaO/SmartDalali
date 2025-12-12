import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search, Send, MessageSquare, Paperclip, Smile, MoreVertical,
  File, Image as ImageIcon, X, Reply, Check, CheckCheck,
  Video, Play, ArrowLeft, Delete, Trash2, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useDeleteConversation,
  useDeleteMessageForMe,
  useDeleteMessageForEveryone,
} from '@/hooks/useConversations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format, isToday, isYesterday } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { communicationService } from '@/api/communications';
import { PropertyChatCard } from '@/components/messaging/PropertyChatCard';
import {
  Message,
  Conversation,
  fetchConversations,
  fetchMessages,
} from '@/api/communications';

export default function AgentMessages() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showConversations, setShowConversations] = useState(true); // For mobile toggle
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedConversationId || 0);
  const sendMessageMutation = useSendMessage();
  const deleteConversation = useDeleteConversation();
  const deleteMessageForMe = useDeleteMessageForMe();
  const deleteMessageForEveryone = useDeleteMessageForEveryone();

  const handleMessageDelete = (messageId: number, type: 'me' | 'everyone') => {
    if (type === 'everyone') {
      if (confirm('Are you sure you want to delete this message for everyone?')) {
        deleteMessageForEveryone.mutate(messageId, {
          onSuccess: () => toast({ title: 'Message deleted for everyone' }),
          onError: () => toast({ title: 'Failed to delete message', variant: 'destructive' }),
        });
      }
    } else {
      if (confirm('Delete this message for yourself?')) {
        deleteMessageForMe.mutate({
          conversationId: selectedConversationId!,
          messageId
        }, {
          onSuccess: () => toast({ title: 'Message deleted for you' }),
          onError: () => toast({ title: 'Failed to delete message', variant: 'destructive' }),
        });
      }
    }
  };

  const conversationsList = Array.isArray(conversations) ? conversations : (conversations as any)?.results || [];
  const selectedConversation = conversationsList.find((c: Conversation) => c.id === selectedConversationId);

  // WebSocket connection with reconnection logic
  useEffect(() => {
    if (!selectedConversationId) {
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(
        `${wsUrl}/ws/chat/${selectedConversationId}/?token=${token}`
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'message') {
          // Invalidate queries to refetch messages instead of reloading page
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } else if (data.type === 'typing') {
          setIsTyping(data.is_typing);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Attempt to reconnect with exponential backoff
        const maxAttempts = 5;
        if (reconnectAttemptsRef.current < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          toast({
            title: 'Connection Lost',
            description: 'Unable to reconnect to chat. Please refresh the page.',
            variant: 'destructive',
          });
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [selectedConversationId, queryClient, toast]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversationsList.filter((conv: Conversation) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      conv.other_participant?.username?.toLowerCase().includes(searchLower) ||
      conv.property_title?.toLowerCase().includes(searchLower)
    );
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTyping = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: 'typing', is_typing: false }));
      }, 3000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!messageText.trim() && selectedFiles.length === 0) || !selectedConversationId) return;

    try {
      const formData = new FormData();
      formData.append('content', messageText.trim());

      if (replyingTo) {
        formData.append('parent_message_id', replyingTo.id.toString());
      }

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content: messageText.trim(),
        attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
        parentMessageId: replyingTo?.id,
      });

      setMessageText('');
      setSelectedFiles([]);
      setReplyingTo(null);

      // Send typing stopped
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConversation = () => {
    if (!selectedConversationId) return;

    if (confirm('Are you sure you want to delete this conversation? This will clear the history for you.')) {
      deleteConversation.mutate(selectedConversationId, {
        onSuccess: () => {
          setSelectedConversationId(null);
          toast({
            title: 'Conversation deleted',
            description: 'The conversation has been removed from your list.',
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to delete conversation.',
            variant: 'destructive',
          });
        }
      });
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    try {
      // TODO: Implement reaction API call
      toast({
        title: 'Reaction added',
        description: `Reacted with ${emoji}`,
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Messages</h1>
          <p className="text-muted-foreground">
            Connect with potential buyers and renters
          </p>
        </div>
      </div>

      <Card className="h-[calc(100vh-200px)] overflow-hidden">
        <div className="grid md:grid-cols-[380px_1fr] h-full relative">
          {/* Conversations List */}
          <div className={cn(
            "border-r transition-all duration-300 ease-in-out",
            "md:block",
            showConversations ? "block" : "hidden md:block"
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

            <ScrollArea className="h-[calc(100%-140px)]">
              <div className="space-y-1 p-4 pt-0">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search ? 'No conversations found' : 'No messages yet'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation: Conversation) => {
                    const isSelected = selectedConversationId === conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversationId(conversation.id);
                          setShowConversations(false); // Hide on mobile when conversation selected
                        }}
                        className={cn(
                          'w-full text-left p-3 rounded-lg transition-all duration-200',
                          'hover:bg-gradient-to-r hover:from-accent/50 hover:to-transparent',
                          'hover:shadow-sm hover:translate-x-1',
                          isSelected && 'bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary shadow-sm'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            {conversation.other_participant?.avatar && (
                              <AvatarImage src={conversation.other_participant.avatar} />
                            )}
                            <AvatarFallback>
                              {getInitials(conversation.other_participant?.username || 'U')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">
                                {conversation.other_participant?.username || 'Unknown'}
                              </p>
                              {conversation.last_message && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(conversation.last_message.created_at), 'MMM d')}
                                </span>
                              )}
                            </div>

                            {conversation.property_title && (
                              <p className="text-xs text-muted-foreground mb-1">
                                📍 {conversation.property_title}
                              </p>
                            )}

                            {conversation.last_message && (
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground truncate flex-1">
                                  {conversation.last_message.has_attachments && '📎 '}
                                  {conversation.last_message.content}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-1">
                              {conversation.unread_count > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                              {conversation.tags?.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: tag.color }}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Property Context - Compact Mode */}
                        {conversation.property && typeof conversation.property === 'object' && conversation.property !== null && (
                          <div className="mt-2">
                            <PropertyChatCard
                              property={{
                                id: typeof conversation.property === 'number' ? conversation.property : (conversation.property?.id ?? 0),
                                title: conversation.property_title || 'Property',
                                price: 0,
                                city: '',
                                primary_image: conversation.property_image,
                                status: 'active',
                              }}
                              compact
                            />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Messages Panel */}
          <div className={cn(
            "flex flex-col",
            "md:block",
            !showConversations ? "block" : "hidden md:block"
          )}>
            {selectedConversationId && selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b bg-gradient-to-r from-background to-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Mobile back button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setShowConversations(true)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar>
                        {selectedConversation.other_participant?.avatar && (
                          <AvatarImage src={selectedConversation.other_participant.avatar} />
                        )}
                        <AvatarFallback>
                          {getInitials(selectedConversation.other_participant?.username || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedConversation.other_participant?.username || 'Conversation'}
                        </CardTitle>
                        {selectedConversation.property_title && (
                          <p className="text-sm text-muted-foreground">
                            {selectedConversation.property_title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Property Context Card */}
                    {selectedConversation.property && typeof selectedConversation.property === 'object' && (
                      <div className="px-4 pb-3">
                        <PropertyChatCard
                          property={{
                            id: typeof selectedConversation.property === 'number' ? selectedConversation.property : (selectedConversation.property?.id ?? 0),
                            title: selectedConversation.property_title || 'Property',
                            price: 0,
                            city: '',
                            primary_image: selectedConversation.property_image,
                            status: 'active',
                          }}
                        />
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={handleDeleteConversation}>
                          Delete Conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((message: Message) => {
                        const currentUserId = user?.id ? parseInt(user.id) : 0;
                        const isOwn = message.sender === currentUserId;

                        const isDeleted = message.is_deleted;
                        const isDeletedUser = message.sender_name === 'Deleted User';

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              'flex gap-2 group',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {!isOwn && (
                              <Avatar className="h-8 w-8">
                                {isDeletedUser ? (
                                  <AvatarFallback>UNK</AvatarFallback>
                                ) : (
                                  <>
                                    {message.sender_avatar && (
                                      <AvatarImage src={message.sender_avatar} />
                                    )}
                                    <AvatarFallback>
                                      {getInitials(message.sender_name)}
                                    </AvatarFallback>
                                  </>
                                )}
                              </Avatar>
                            )}

                            <div className={cn('flex flex-col gap-1', isOwn && 'items-end')}>
                              {/* Thread indicator */}
                              {!isDeleted && message.thread_info?.is_reply && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                                  <Reply className="h-3 w-3" />
                                  Replying to: {message.thread_info.parent_preview}
                                </div>
                              )}

                              <div
                                className={cn(
                                  'max-w-[85%] md:max-w-[70%] rounded-lg p-3 relative',
                                  'transition-all duration-200',
                                  isOwn
                                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md'
                                    : 'bg-gradient-to-br from-muted to-muted/50 shadow-sm',
                                  isDeleted && 'bg-muted/50 text-muted-foreground italic border border-dashed'
                                )}
                              >
                                {isDeleted ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[10px]">!</div>
                                    <p className="text-sm">This message was deleted</p>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                                    {/* Attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {message.attachments.map((attachment) => (
                                          <a
                                            key={attachment.id}
                                            href={attachment.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                              'flex items-center gap-2 p-2 rounded border',
                                              isOwn
                                                ? 'border-primary-foreground/20 hover:bg-primary-foreground/10'
                                                : 'border-border hover:bg-muted-foreground/10'
                                            )}
                                          >
                                            {attachment.file_type === 'image' ? (
                                              <ImageIcon className="h-4 w-4" />
                                            ) : (
                                              <File className="h-4 w-4" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs truncate">{attachment.file_name}</p>
                                              <p className="text-xs opacity-70">
                                                {attachment.file_size_display}
                                              </p>
                                            </div>
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}

                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs opacity-70">
                                    {formatMessageTime(message.created_at)}
                                  </span>
                                  {isOwn && (
                                    <span className="text-xs opacity-70">
                                      {message.is_read ? (
                                        <CheckCheck className="h-3 w-3" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Reactions */}
                              {!isDeleted && message.reaction_summary &&
                                Object.keys(message.reaction_summary).length > 0 && (
                                  <div className="flex gap-1">
                                    {Object.entries(message.reaction_summary).map(
                                      ([emoji, count]) => (
                                        <button
                                          key={emoji}
                                          onClick={() => handleReaction(message.id, emoji)}
                                          className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted-foreground/20"
                                        >
                                          {emoji} {count}
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}

                              {/* Message actions */}
                              {!isDeleted && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setReplyingTo(message)}
                                  >
                                    <Reply className="h-3 w-3 mr-1" />
                                    Reply
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleReaction(message.id, '👍')}
                                  >
                                    <Smile className="h-3 w-3 mr-1" />
                                    React
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isOwn ? "end" : "start"}>
                                      <DropdownMenuItem onClick={() => handleMessageDelete(message.id, 'me')}>
                                        Delete for me
                                      </DropdownMenuItem>

                                      {isOwn && (new Date().getTime() - new Date(message.created_at).getTime() < 3600000) && (
                                        <DropdownMenuItem
                                          onClick={() => handleMessageDelete(message.id, 'everyone')}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          Delete for everyone
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>

                            {isOwn && (
                              <Avatar className="h-8 w-8">
                                {message.sender_avatar && (
                                  <AvatarImage src={message.sender_avatar} />
                                )}
                                <AvatarFallback>
                                  {getInitials(message.sender_name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
                          <div className="flex gap-1">
                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                          </div>
                          {selectedConversation.other_participant?.username} is typing...
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-3 md:p-4 bg-gradient-to-br from-background to-accent/5">
                  {/* Reply indicator */}
                  {replyingTo && (
                    <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Reply className="h-4 w-4" />
                        <span className="text-muted-foreground">
                          Replying to {replyingTo.sender_name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* File previews */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-2 flex gap-2 flex-wrap">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted rounded"
                        >
                          <File className="h-4 w-4" />
                          <span className="text-sm truncate max-w-[150px]">
                            {file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-10 w-10 md:h-9 md:w-9"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      className="flex-1 h-10 md:h-9 text-base md:text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={
                        (!messageText.trim() && selectedFiles.length === 0) ||
                        sendMessageMutation.isPending
                      }
                      className="flex-shrink-0 h-10 w-10 md:h-9 md:w-auto md:px-4"
                    >
                      <Send className="h-5 w-5 md:h-4 md:w-4" />
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
