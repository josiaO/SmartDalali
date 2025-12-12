import React, { useState } from 'react';
import { Message } from '@/api/communications';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Clock, Trash2, Paperclip, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    showAvatar: boolean;
    onDelete: (id: number) => void;
    onReply: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, showAvatar, onDelete, onReply }) => {
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);

    // Theme-Aware Classes
    const myBubbleClass = "bg-primary text-primary-foreground rounded-br-none shadow-md border-none";
    const otherBubbleClass = "bg-card text-card-foreground border border-border rounded-bl-none shadow-sm dark:bg-slate-800/80";

    // Animation classes
    const animationClass = isMe ? "animate-slide-in-right" : "animate-slide-in-left";

    if (message.is_deleted) {
        return (
            <div
                className={cn("flex w-full mb-4 group relative", isMe ? "justify-end" : "justify-start", animationClass)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {!isMe && <div className="w-8 mr-2 flex-shrink-0" />} {/* Spacer for avatar alignment */}

                <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 italic text-muted-foreground flex items-center text-sm border border-border bg-muted/50 relative",
                    isMe ? "rounded-br-none" : "rounded-bl-none"
                )}>
                    {/* Delete For Me Button (Floating on hover) */}
                    <button
                        onClick={() => onDelete(message.id)}
                        className={cn(
                            "absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200",
                            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
                        )}
                        title="Remove from view"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <Trash2 className="w-3 h-3 mr-2 op-50" />
                    This message was deleted
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("flex w-full mb-4 group relative", isMe ? "justify-end" : "justify-start", animationClass)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            id={`message-${message.id}`}
        >
            {/* Avatar for 'Other' */}
            {!isMe && (
                <div className="w-8 mr-2 flex-shrink-0 self-end mb-1">
                    {showAvatar ? (
                        <img
                            src={message.sender_avatar || `https://ui-avatars.com/api/?name=${message.sender_name}&background=6366f1&color=fff`}
                            className="w-8 h-8 rounded-full shadow-sm ring-1 ring-background"
                            alt={message.sender_name}
                        />
                    ) : <div className="w-8" />}
                </div>
            )}

            {/* Bubble */}
            <div className={cn(
                "max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 relative transition-all duration-300 flex flex-col",
                isMe ? myBubbleClass : otherBubbleClass,
                isHovered && "shadow-lg scale-[1.01]"
            )}>

                {/* Reply info if any */}
                {message.reply_to && (
                    <div className="text-xs mb-2 pl-2 border-l-2 border-primary/50 opacity-80 bg-black/5 dark:bg-white/10 p-1 rounded-sm cursor-pointer"
                        onClick={() => {
                            document.getElementById(`message-${message.reply_to?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                    >
                        <span className="font-semibold">{message.reply_to.sender_name}</span>
                        <p className="truncate">{message.reply_to.text}</p>
                    </div>
                )}

                {/* Action Buttons (Floating) */}
                <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 flex space-x-1 transition-all duration-200",
                    isMe ? "-left-16" : "-right-16", // Adjusted for 2 buttons
                    isHovered ? "opacity-100 translate-x-0" : isMe ? "opacity-0 translate-x-4 pointer-events-none" : "opacity-0 -translate-x-4 pointer-events-none"
                )}>
                    <button
                        onClick={() => onReply(message)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Reply"
                    >
                        <Reply className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(message.id)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title={isMe ? "Delete" : "Delete for me"}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                {message.attachment && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-border/50">
                        {message.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={message.attachment} alt="Attachment" className="max-h-60 w-full object-cover" />
                        ) : (
                            <a
                                href={message.attachment}
                                target="_blank"
                                rel="noreferrer"
                                className={cn("flex items-center p-3 text-sm hover:underline", isMe ? "text-primary-foreground/90 bg-white/10" : "text-primary bg-muted")}
                            >
                                <Paperclip className="w-4 h-4 mr-2" />
                                View Attachment
                            </a>
                        )}
                    </div>
                )}

                <p className="whitespace-pre-wrap text-[15px] leading-relaxed relative z-10 break-words">
                    {message.text}
                </p>

                {/* Metadata */}
                <div className={cn(
                    "flex items-center justify-end mt-1 space-x-1.5 text-[10px] select-none",
                    isMe ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                    <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                    {isMe && (
                        <span className="flex items-center ml-1">
                            {(message as any).status === 'pending' ? (
                                <Clock className="w-3 h-3 animate-pulse" />
                            ) : message.read_at ? (
                                <CheckCheck className="w-3.5 h-3.5 text-accent" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                        </span>
                    )}
                </div>

                {/* Pulse decoration for 'Other' messages to feel alive */}
                {!isMe && (
                    <div className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 bg-primary rounded-full blur-sm opacity-20 animate-pulse"></div>
                )}
            </div>
        </div>
    );
};
