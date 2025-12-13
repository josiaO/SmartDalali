import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Message, MessageAttachment } from '@/api/communications';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    currentUserId: number;
}

export default function MessageList({ messages, isLoading, currentUserId }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // This is a bit of a hack for Shadcn ScrollArea which hides the viewport
        // We try to find the viewport in the DOM or use the ref directly if possible
        const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <p>No messages yet.</p>
                <p className="text-sm">Say hello!</p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef}>
            <div className="flex flex-col gap-4 pb-4">
                {messages.map((message) => {
                    const isOptimistic = message.isOptimistic;
                    // Determine if own message.
                    // Note: API `sender` is an ID.
                    const isOwn = message.sender === currentUserId || isOptimistic;

                    return (
                        <div
                            key={message.id}
                            className={cn(
                                "flex w-full",
                                isOwn ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    isOwn
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted text-foreground rounded-tl-none",
                                    isOptimistic && "opacity-70"
                                )}
                            >
                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="mb-2 flex flex-col gap-1">
                                        {message.attachments.map((att: MessageAttachment, i: number) => (
                                            <div key={i} className="flex items-center gap-2 bg-black/10 p-2 rounded">
                                                <Paperclip className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">{att.file_name || 'Attachment'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="whitespace-pre-wrap break-words">{message.content}</p>

                                <div className={cn("flex items-center gap-1 mt-1 text-[10px]", isOwn ? "justify-end text-primary-foreground/80" : "text-muted-foreground")}>
                                    <span>{message.created_at ? format(new Date(message.created_at), 'p') : 'Sending...'}</span>
                                    {isOptimistic && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
