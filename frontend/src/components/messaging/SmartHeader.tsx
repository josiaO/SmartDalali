import React, { useState } from 'react';
import { Conversation } from '../../api/messaging';
import { ArrowLeft, MapPin, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartHeaderProps {
    conversation: Conversation;
    onBack?: () => void;
    active: boolean;
    onClearChat?: () => void;
}

export const SmartHeader: React.FC<SmartHeaderProps> = ({ conversation, onBack, active, onClearChat }) => {
    const other = conversation.other_participant;
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-all duration-300 dark:bg-slate-900/80">
            <div className="flex items-center space-x-4">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <div className="relative">
                    <img
                        src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.username}&background=random`}
                        className="w-11 h-11 rounded-full border-2 border-background shadow-sm object-cover"
                        alt={other?.username}
                    />
                    {/* Status Indicator */}
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${active ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                </div>

                <div>
                    <h3 className="font-bold text-foreground text-lg leading-tight flex items-center">
                        {other?.username}
                        {active && <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">Online</span>}
                    </h3>

                    {/* Property Context Chip */}
                    {conversation.property_title && (
                        <div className="flex items-center mt-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[200px] truncate hover:bg-muted transition-colors cursor-pointer group">
                            <MapPin className="w-3 h-3 mr-1 text-primary flex-shrink-0" />
                            <span className="truncate">{conversation.property_title}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
                {onClearChat && (
                    <button
                        onClick={() => {
                            if (confirm("Are you sure you want to clear this conversation? This will hide all current messages from your view.")) {
                                onClearChat();
                            }
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};
