import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Conversation } from '@/api/communications';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    search: string;
    onSearchChange: (val: string) => void;
    className?: string; // Allow passing className for responsive hiding
}

export default function ConversationList({
    conversations,
    selectedId,
    onSelect,
    search,
    onSearchChange,
    className
}: ConversationListProps) {

    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName || !lastName) return '';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const filteredConversations = conversations.filter((conv) => {
        if (!search) return true;
        const participant = conv.participants && conv.participants.length > 0 ? (conv.participants[0] as any) : null;
        // Note: The type definition in api/communications.ts defines participants as number[], 
        // but the actual API response seems to populate it or use 'other_participant' field based on my previous read.
        // I will double check the type definition I saw earlier.
        // In `communications.ts` I saw `participants: number[]` but in `Conversations.tsx` it was accessing fields on it.
        // Usage in Conversations.tsx:
        // const otherParticipant = conversation.participants && conversation.participants.length > 0 ? conversation.participants[0] : null;
        // This implies `participants` is an array of objects in the runtime response even if the interface says number[].
        // Wait, let me check `communications.ts` again. It has `other_participant: OtherParticipant`.
        // I should probably use `other_participant`.

        // Let's look at `Conversations.tsx` again.
        // It maps `conversation.participants`.

        // To be safe and robust, I will try to use `other_participant` if available, or fall back to checking `participants` array if it contains objects.

        const name = conv.other_participant
            ? `${conv.other_participant.username}`
            : (participant && typeof participant === 'object' ? `${participant.first_name} ${participant.last_name}` : '');

        return name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className={cn("border-r h-full flex flex-col bg-card", className)}>
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-4">Conversations</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No conversations found</p>
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => {
                            // Logic to extract name and details.
                            // Based on `Conversations.tsx`, `other_participant` seems to be the one intended for use or `participants[0]`.
                            // I'll stick to a safe extraction.
                            let other = conversation.other_participant;
                            if (!other && conversation.participants && conversation.participants.length > 0) {
                                // Dynamic check if it's an object (runtime fix)
                                const p: any = conversation.participants[0];
                                if (typeof p === 'object') {
                                    other = {
                                        id: p.id,
                                        username: p.username || `${p.first_name} ${p.last_name}`,
                                        email: '',
                                        role: '',
                                        avatar: p.avatar
                                    };
                                }
                            }

                            const name = other ? (other.username || 'User') : 'Unknown';
                            const initials = other ? getInitials(other.username?.split(' ')[0], other.username?.split(' ')[1]) : '?';

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelect(conversation.id)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50",
                                        selectedId === conversation.id && "bg-muted"
                                    )}
                                >
                                    <Avatar>
                                        {other?.avatar && <img src={other.avatar} alt={name} />}
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium truncate">{name}</span>
                                            {conversation.last_message && (
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {format(new Date(conversation.last_message.created_at), 'MMM d')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-muted-foreground truncate max-w-[140px]">
                                                {conversation.last_message?.content || 'No messages'}
                                            </p>
                                            {conversation.unread_count > 0 && (
                                                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                                    {conversation.unread_count}
                                                </Badge>
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
    );
}
