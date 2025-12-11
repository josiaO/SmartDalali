import { Message, Conversation } from '@/api/communications';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatWindowProps {
    conversation: Conversation | null; // Full conversation object to get details
    messages: Message[];
    loadingMessages: boolean;
    currentUserId: number;
    onSendMessage: (content: string, file: File | null) => Promise<void>;
    onBack?: () => void; // For mobile
}

export default function ChatWindow({
    conversation,
    messages,
    loadingMessages,
    currentUserId,
    onSendMessage,
    onBack
}: ChatWindowProps) {

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                <div className="text-center p-6">
                    <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
                    <p>Choose a contact to start messaging.</p>
                </div>
            </div>
        );
    }

    // Extract other participant details
    const other = conversation.other_participant;
    // Fallback for runtime safety
    const name = other?.username || 'Chat';
    const getInitials = (n: string) => n.slice(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Header */}
            <div className="border-b p-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}

                    <Avatar className="h-9 w-9">
                        {other?.avatar && <img src={other.avatar} alt={name} />}
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>

                    <div>
                        <h3 className="font-semibold text-sm">{name}</h3>
                        {/* Optional: Online status or role */}
                        <p className="text-xs text-muted-foreground">{other?.role || 'Agent'}</p>
                    </div>
                </div>

                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            {/* Messages */}
            <MessageList
                messages={messages}
                isLoading={loadingMessages}
                currentUserId={currentUserId}
            />

            {/* Input */}
            <MessageInput onSendMessage={onSendMessage} />
        </div>
    );
}
