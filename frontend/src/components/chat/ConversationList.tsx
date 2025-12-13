import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Conversation, OtherParticipant, User } from '@/api/communications';

// Type for participant object that might be returned by API (even though interface says number[])
interface ParticipantObject {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
    email?: string;
    role?: string;
}

// Type guard to check if a value is a participant object
function isParticipantObject(value: unknown): value is ParticipantObject {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof (value as ParticipantObject).id === 'number'
    );
}

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
        
        // Prefer other_participant, fall back to participants array if needed
        let participantName = '';
        if (conv.other_participant) {
            participantName = conv.other_participant.username || '';
        } else if (conv.participants && conv.participants.length > 0) {
            const firstParticipant = conv.participants[0];
            if (isParticipantObject(firstParticipant)) {
                participantName = firstParticipant.username || 
                    `${firstParticipant.first_name || ''} ${firstParticipant.last_name || ''}`.trim();
            }
        }

        return participantName.toLowerCase().includes(search.toLowerCase());
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
                            // Prefer other_participant, fall back to participants array if needed
                            let other: OtherParticipant | User | null = conversation.other_participant || null;
                            if (!other && conversation.participants && conversation.participants.length > 0) {
                                const firstParticipant = conversation.participants[0];
                                if (isParticipantObject(firstParticipant)) {
                                    other = {
                                        id: firstParticipant.id,
                                        username: firstParticipant.username || 
                                            `${firstParticipant.first_name || ''} ${firstParticipant.last_name || ''}`.trim() ||
                                            'User',
                                        email: firstParticipant.email || '',
                                        role: firstParticipant.role || '',
                                        avatar: firstParticipant.avatar || null
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
