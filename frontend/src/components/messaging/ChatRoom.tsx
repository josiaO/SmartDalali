import React, { useEffect, useState, useRef } from 'react';
import { messagingService, Message, Conversation } from '@/api/communications';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Paperclip, Loader2, X, Smile, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MessageBubble } from './MessageBubble';
import { SmartHeader } from './SmartHeader';
import { QuickActionBar } from './QuickActionBar';
import { TypingIndicator } from './TypingIndicator';
import { PropertyChatCard } from './PropertyChatCard';
import { PropertySelector } from './PropertySelector';
import { cn } from '@/lib/utils';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { communicationService } from '@/api/communications';
import { Property } from '@/api/properties';
import { useQueryClient } from '@tanstack/react-query';

interface ChatRoomProps {
    conversation: Conversation;
    onBack?: () => void;
    onConversationDeleted?: () => void;
    onConversationUpdated?: (conversation: Conversation) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ conversation, onBack, onConversationDeleted, onConversationUpdated }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [localConversation, setLocalConversation] = useState<Conversation>(conversation);
    
    // Determine the agent ID for property filtering
    // - If current user is a regular user, show properties from the agent they're chatting with
    // - If current user is an agent, show their own properties
    const agentId = React.useMemo(() => {
        const currentUserId = user?.id ? parseInt(user.id) : null;
        const userRole = user?.role || conversation.other_participant?.role;
        
        // If current user is an agent, they should see their own properties
        if (userRole === 'agent' && currentUserId) {
            return currentUserId;
        }
        
        // If current user is a regular user, show properties from the agent they're chatting with
        // If conversation has agent field, use it
        if (conversation.agent) {
            return conversation.agent;
        }
        // Otherwise, if other_participant is an agent, use their ID
        if (conversation.other_participant && conversation.other_participant.role === 'agent') {
            return conversation.other_participant.id;
        }
        // Fallback: if user is not the agent, the other participant must be
        if (conversation.user === currentUserId && conversation.other_participant) {
            return conversation.other_participant.id;
        }
        return undefined;
    }, [conversation, user]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputText, setInputText] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [updatingProperty, setUpdatingProperty] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await messagingService.getMessages(localConversation.id);
            // Ensure no duplicates from initial fetch
            setMessages(data);
            scrollToBottom();
            messagingService.markRead(localConversation.id);
        } catch (error) {
            console.error("Failed to load messages", error);
            toast.error("Failed to load conversation history");
        } finally {
            setLoading(false);
        }
    }, [localConversation.id]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    useEffect(() => {
        fetchMessages();

        // WebSocket setup...
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).host
            : 'localhost:8000';

        const wsUrl = `${protocol}//${host}/ws/chat/${localConversation.id}/?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsOnline(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message') {
                    const newMsg = data.message as Message;
                    setMessages(prev => {
                        // Check if we already have this message (by ID)
                        const exists = prev.some(m => m.id === newMsg.id);
                        if (exists) {
                            // Update existing message (e.g., status change)
                            return prev.map(m => m.id === newMsg.id ? newMsg : m);
                        }
                        return [...prev, newMsg];
                    });
                    // If we receive a message from the other person, they are definitely online
                    if (newMsg.sender !== Number(user?.id)) {
                        setIsOnline(true);
                    }
                    scrollToBottom();
                } else if (data.type === 'user_status') {
                    setIsOnline(data.is_online);
                } else if (data.type === 'typing') {
                    setIsTyping(data.is_typing);
                } else if (data.type === 'error') {
                    toast.error(data.message || 'WebSocket error');
                }
            } catch (e) {
                console.error("WS Parse error", e);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsOnline(false);
        };

        ws.onclose = () => {
            setIsOnline(false);
        };

        socketRef.current = ws;

        return () => {
            // CRITICAL: Proper cleanup to prevent memory leaks
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            setIsOnline(false);
            socketRef.current = null;
        };
    }, [localConversation.id, user, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() && !attachment) return;

        const tempId = Date.now();
        const tempMsg: Message & { status?: 'pending' } = {
            id: tempId,
            sender: Number(user?.id) || 0,
            sender_name: user?.username || 'Me',
            sender_role: 'user',
            sender_avatar: null,
            text: inputText,
            attachment: attachment ? URL.createObjectURL(attachment) : null,
            read_at: null,
            is_deleted: false,
            created_at: new Date().toISOString(),
            status: 'pending',
            reply_to: replyingTo || undefined
        };

        try {
            setSending(true);
            setMessages(prev => [...prev, tempMsg]);

            const data = {
                text: inputText,
                attachment: attachment || undefined
            };

            setInputText('');
            setAttachment(null);
            setReplyingTo(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            const sentMsg = await messagingService.sendMessage(localConversation.id, data, replyingTo?.id);

            setMessages(prev => {
                // Robust deduplication:
                // 1. Remove the temporary message
                const withoutTemp = prev.filter(m => m.id !== tempId);

                // 2. Check if the REAL message is already in the list (e.g. came via WS race)
                const exists = withoutTemp.some(m => m.id === sentMsg.id);

                if (exists) {
                    return withoutTemp;
                }

                // 3. Keep order: insert at end
                return [...withoutTemp, sentMsg];
            });

        } catch (error) {
            console.error("Failed to send", error);
            toast.error("Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    const handleClearChat = async () => {
        try {
            await messagingService.clearConversation(localConversation.id);
            setMessages([]);
            toast.success("Conversation cleared");
            if (onBack) onBack(); // Go back to list
            if (onConversationDeleted) onConversationDeleted(); // Refresh list
        } catch (error) {
            console.error("Failed to clear chat", error);
            toast.error("Failed to clear conversation");
        }
    };

    const handleQuickAction = (actionId: string) => {
        switch (actionId) {
            case 'book_visit':
                toast.info("Opening booking calendar...");
                break;
            case 'call_agent':
                toast.success("Calling agent...");
                window.location.href = `tel:+255713808080`; // Placeholder
                break;
            case 'see_map':
                toast.info("Opening map view...");
                break;
            case 'property_info':
                toast.info("Showing property details...");
                break;
            default:
                break;
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleDelete = async (messageId: number) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const isMe = message.sender === (Number(user?.id) || 0);
        const isAlreadyDeleted = message.is_deleted;

        let confirmText = "";
        if (isMe && !isAlreadyDeleted) {
            confirmText = "Delete this message? (It will be removed for everyone)";
        } else {
            confirmText = "Remove this message from your view?";
        }

        if (!confirm(confirmText)) return;

        try {
            if (isMe && !isAlreadyDeleted) {
                // Soft delete (for everyone)
                await messagingService.deleteMessage(localConversation.id, messageId);
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m));
                toast.success("Message deleted");
            } else {
                // Hide (delete for me)
                await messagingService.deleteMessageForMe(localConversation.id, messageId);
                setMessages(prev => prev.filter(m => m.id !== messageId));
                toast.success("Message removed from view");
            }
        } catch (error) {
            console.error("Failed to delete message", error);
            toast.error("Failed to delete message");
        }
    };

    // Update local conversation when prop changes
    useEffect(() => {
        setLocalConversation(conversation);
    }, [conversation]);

    const handleAttachProperty = async (property: Property) => {
        try {
            setUpdatingProperty(true);
            const updatedConversation = await communicationService.updateConversationProperty(
                localConversation.id,
                parseInt(property.id)
            );
            
            // Update local state
            setLocalConversation(updatedConversation);
            
            // Notify parent component
            if (onConversationUpdated) {
                onConversationUpdated(updatedConversation);
            }
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            
            toast.success(`Property "${property.title}" attached to conversation`);
        } catch (error) {
            console.error("Failed to attach property:", error);
            toast.error("Failed to attach property. Please try again.");
        } finally {
            setUpdatingProperty(false);
        }
    };

    const handleRemoveProperty = async () => {
        if (!confirm('Are you sure you want to remove the attached property from this conversation?')) {
            return;
        }

        try {
            setUpdatingProperty(true);
            const updatedConversation = await communicationService.updateConversationProperty(
                localConversation.id,
                null
            );
            
            // Update local state
            setLocalConversation(updatedConversation);
            
            // Notify parent component
            if (onConversationUpdated) {
                onConversationUpdated(updatedConversation);
            }
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            
            toast.success("Property removed from conversation");
        } catch (error) {
            console.error("Failed to remove property:", error);
            toast.error("Failed to remove property. Please try again.");
        } finally {
            setUpdatingProperty(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-background relative overflow-hidden transition-colors duration-300">
            {/* Ultra-Smart Header */}
            <SmartHeader
                conversation={localConversation}
                onBack={onBack}
                active={isOnline}
                onClearChat={handleClearChat}
            />

            {/* Property Context - Prominently Displayed */}
            {localConversation.property ? (() => {
                const prop = localConversation.property;
                const propId = typeof prop === 'number' 
                    ? prop 
                    : (typeof prop === 'object' && prop !== null && 'id' in prop 
                        ? (prop as { id: number }).id 
                        : null);
                
                return (
                    <div className="px-4 py-4 border-b bg-gradient-to-r from-primary/5 via-background to-background border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                    Property in Discussion
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <PropertySelector
                                    onSelect={handleAttachProperty}
                                    currentPropertyId={propId}
                                    agentId={agentId}
                                    trigger={
                                        <button
                                            className="text-xs text-primary hover:underline font-medium px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                                            disabled={updatingProperty}
                                        >
                                            {updatingProperty ? 'Updating...' : 'Change'}
                                        </button>
                                    }
                                />
                                <button
                                    onClick={handleRemoveProperty}
                                    disabled={updatingProperty}
                                    className="text-xs text-destructive hover:text-destructive/80 font-medium px-2 py-1 rounded hover:bg-destructive/10 transition-colors flex items-center gap-1"
                                    aria-label="Remove property"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Remove
                                </button>
                            </div>
                        </div>
                        <PropertyChatCard
                            property={{
                                id: propId || 0,
                                title: localConversation.property_title || 'Property',
                                price: 0,
                                city: '',
                                primary_image: localConversation.property_image || undefined,
                                status: 'active',
                            }}
                        />
                    </div>
                );
            })() : (
                <div className="px-4 py-4 border-b bg-gradient-to-r from-amber-50/50 via-background to-background border-amber-200/50 border-dashed dark:from-amber-950/20 dark:border-amber-800/30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <p className="text-sm font-semibold text-foreground">
                                    No property attached
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Attach a property to help the receiver understand your inquiry
                            </p>
                        </div>
                        <PropertySelector
                            onSelect={handleAttachProperty}
                            agentId={agentId}
                            trigger={
                                <button
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={updatingProperty}
                                >
                                    {updatingProperty ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                                            Attaching...
                                        </>
                                    ) : (
                                        'Attach Property'
                                    )}
                                </button>
                            }
                        />
                    </div>
                </div>
            )}

            {/* Connection Status Banner */}
            {!isOnline && (
                <div className="bg-yellow-500/90 dark:bg-yellow-600/90 text-white px-4 py-2 text-sm text-center flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span>⚠️ Reconnecting to chat...</span>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {/* Subtle Background Pattern or Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />

                {messages.map((msg, index) => {
                    const isMe = msg.sender === (Number(user?.id) || 0);
                    const showAvatar = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);
                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMe={isMe}
                            showAvatar={showAvatar}
                            onDelete={handleDelete}
                            onReply={setReplyingTo}
                        />
                    );
                })}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Bar (Floating) */}
            <QuickActionBar conversation={localConversation} onAction={handleQuickAction} />

            {/* Expressive Input Area */}
            <div className="bg-card border-t border-border p-4 relative z-20 shadow-lg dark:shadow-none transition-colors duration-300">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-muted/80 px-4 py-2 rounded-t-lg -mx-4 -mt-4 mb-4 border-b border-border/50 backdrop-blur-sm animate-slide-in-up">
                        <div className="flex flex-col text-sm border-l-2 border-primary pl-2">
                            <span className="font-semibold text-primary">Replying to {replyingTo.sender_name}</span>
                            <span className="text-muted-foreground truncate max-w-xs">{replyingTo.text}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-black/10 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {attachment && (
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg mb-2 animate-slide-in-right border border-border">
                        <div className="flex items-center text-sm text-foreground">
                            <Paperclip className="w-4 h-4 mr-2 text-primary-500" />
                            {attachment.name}
                        </div>
                        <button onClick={() => setAttachment(null)} className="text-destructive text-xs hover:underline font-medium">Remove</button>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2 relative z-10">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        aria-label="Attach file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx"
                    />

                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={cn(
                            "p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95",
                            showEmojiPicker 
                                ? "text-primary bg-primary/10" 
                                : "text-muted-foreground hover:text-primary hover:bg-muted"
                        )}
                        aria-label="Add emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div
                            ref={emojiPickerRef}
                            className="absolute bottom-16 left-12 z-50 shadow-2xl rounded-xl overflow-hidden border border-border/50 backdrop-blur-sm"
                        >
                            <Picker
                                data={data}
                                onEmojiSelect={(emoji: { native: string }) => {
                                    setInputText(inputText + emoji.native);
                                    setShowEmojiPicker(false);
                                }}
                                theme="auto"
                                previewPosition="none"
                                skinTonePosition="none"
                            />
                        </div>
                    )}

                    <div className="flex-1 relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                            maxLength={5000}
                            className="w-full bg-muted/60 dark:bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background text-foreground placeholder:text-muted-foreground rounded-2xl px-4 py-3 max-h-32 focus:ring-2 focus:ring-primary/20 resize-none overflow-y-auto transition-all duration-300 shadow-sm"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        {inputText.length > 0 && (
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                                {inputText.length}/5000
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={sending || (!inputText.trim() && !attachment)}
                        className={cn(
                            "p-3 rounded-xl text-primary-foreground transition-all duration-300 shadow-md flex items-center justify-center min-w-[48px]",
                            (sending || (!inputText.trim() && !attachment))
                                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                : "bg-primary hover:scale-105 hover:shadow-lg active:scale-95"
                        )}
                        aria-label="Send message"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom;
