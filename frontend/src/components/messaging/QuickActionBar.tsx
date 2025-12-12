import React from 'react';
import { Calendar, Phone, MapPin, Info, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/api/communications';

interface QuickActionBarProps {
    conversation: Conversation;
    onAction: (action: string) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({ conversation, onAction }) => {
    // Only show if there is a related property, or generic actions if not
    const actions = [
        { id: 'book_visit', label: 'Book Visit', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
        { id: 'call_agent', label: 'Call Agent', icon: Phone, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
        { id: 'see_map', label: 'See Map', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    ];

    if (conversation.property_title) {
        actions.push({ id: 'property_info', label: 'Property', icon: Info, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' });
    }

    return (
        <div className="absolute bottom-[80px] left-0 right-0 px-4 z-10 opacity-0 animate-slide-in-right pointer-events-none" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 pointer-events-auto max-w-full mask-gradient">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => onAction(action.id)}
                        className={cn(
                            "flex items-center space-x-1.5 px-3 py-1.5 rounded-full shadow-sm border border-border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap",
                            "bg-card/90 hover:bg-card dark:bg-slate-800/90",
                            action.bg
                        )}
                    >
                        <action.icon className={cn("w-3.5 h-3.5", action.color)} />
                        <span className={cn("text-xs font-medium text-foreground", action.color)}>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
