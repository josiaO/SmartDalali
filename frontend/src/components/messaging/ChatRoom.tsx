import React, { useEffect, useState, useRef } from 'react';
import { messagingService, Message, Conversation } from '@/api/communications';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Paperclip, Loader2, X, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { MessageBubble } from './MessageBubble';
import { SmartHeader } from './SmartHeader';
import { QuickActionBar } from './QuickActionBar';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/utils';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface ChatRoomProps {
    conversation: Conversation;
    onBack?: () => void;
    onConversationDeleted?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ conversation, onBack, onConversationDeleted }) => {
    const { user } = useAuth();
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const data = await messagingService.getMessages(conversation.id);
            // Ensure no duplicates from initial fetch
            setMessages(data);
            scrollToBottom();
            messagingService.markRead(conversation.id);
        } catch (error) {
            console.error("Failed to load messages", error);
            toast.error("Failed to load conversation history");
        } finally {
            setLoading(false);
        }
    };

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

        const wsUrl = `${protocol}//${host}/ws/chat/${conversation.id}/?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => console.log(`Connected to chat ${conversation.id}`);

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
                }
            } catch (e) {
                console.error("WS Parse error", e);
            }
        };

        socketRef.current = ws;

        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [conversation.id]);

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

            const sentMsg = await messagingService.sendMessage(conversation.id, data, replyingTo?.id);

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
            console.log('[ChatRoom] Clearing conversation:', conversation.id);
            await messagingService.clearConversation(conversation.id);
            setMessages([]);
            toast.success("Conversation cleared");
            console.log('[ChatRoom] Cleared successfully, calling callbacks');
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
                await messagingService.deleteMessage(conversation.id, messageId);
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m));
                toast.success("Message deleted");
            } else {
                // Hide (delete for me)
                await messagingService.deleteMessageForMe(conversation.id, messageId);
                setMessages(prev => prev.filter(m => m.id !== messageId));
                toast.success("Message removed from view");
            }
        } catch (error) {
            console.error("Failed to delete message", error);
            toast.error("Failed to delete message");
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
        <div className="flex flex-col h-full bg-background relative overflow-hidden transition-colors duration-300">
            {/* Ultra-Smart Header */}
            <SmartHeader
                conversation={conversation}
                onBack={onBack}
                active={isOnline}
                onClearChat={handleClearChat}
            />

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
            <QuickActionBar conversation={conversation} onAction={handleQuickAction} />

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

                <form onSubmit={handleSend} className="flex items-end space-x-2 relative z-10">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all duration-200"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-3 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all duration-200"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div
                            ref={emojiPickerRef}
                            className="absolute bottom-16 left-12 z-50 shadow-2xl rounded-lg overflow-hidden border border-border"
                        >
                            <Picker
                                data={data}
                                onEmojiSelect={(emoji: any) => {
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
                            className="w-full bg-muted/50 border-transparent focus:border-ring focus:bg-background text-foreground placeholder:text-muted-foreground rounded-2xl px-4 py-3 max-h-32 focus:ring-2 focus:ring-ring/20 resize-none overflow-y-auto transition-all duration-300 shadow-inner"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={sending || (!inputText.trim() && !attachment)}
                        className={cn(
                            "p-3 rounded-full text-primary-foreground transition-all duration-300 shadow-md flex items-center justify-center",
                            (sending || (!inputText.trim() && !attachment))
                                ? "bg-muted text-muted-foreground cursor-not-allowed scale-95 opacity-70"
                                : "bg-primary hover:scale-110 hover:shadow-lg active:scale-95"
                        )}
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom;
