import React, { useEffect, useState } from 'react';
import { messagingService, Conversation } from '@/api/communications';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Search, MessageSquare, ImageIcon } from 'lucide-react';

interface ConversationListProps {
    onSelectConversation: (conversation: Conversation) => void;
    selectedId?: number;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation, selectedId }) => {
    const { user } = useAuth();
    const { lastMessage } = useWebSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchConversations = async () => {
        try {
            console.log('[ConversationList] Fetching conversations...');
            setLoading(true);
            const data = await messagingService.getConversations();
            console.log('[ConversationList] Received conversations:', data.length, data);
            setConversations(data);
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('[ConversationList] Component mounted, fetching...');
        fetchConversations();
    }, []);

    // Handle real-time updates
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'notification') {
            // If we receive a notification about a new message, refresh the list or update local state
            // Ideally optimize to just update the specific conversation
            fetchConversations();
        }
    }, [lastMessage]);

    const filteredConversations = conversations.filter(c => {
        const other = c.other_participant;
        const name = other?.username || '';
        const prop = c.property_title || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prop.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex flex-col space-y-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p>No conversations yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
            <div className="p-4 border-b border-slate-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(conversation => {
                    const other = conversation.other_participant;
                    const isSelected = selectedId === conversation.id;
                    const hasUnread = conversation.unread_count > 0;

                    return (
                        <div
                            key={conversation.id}
                            onClick={() => onSelectConversation(conversation)}
                            className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 ${isSelected ? 'bg-primary-50 hover:bg-primary-50' : ''
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="relative">
                                    <img
                                        src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.username}&background=random`}
                                        alt={other?.username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    {other?.role === 'agent' && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] px-1 rounded-full border border-white">
                                            Ag
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-700' : 'text-slate-900'}`}>
                                            {other?.username}
                                        </h3>
                                        {conversation.last_message && (
                                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>

                                    {conversation.property_title && (
                                        <div className="text-xs text-slate-500 mb-1 truncate flex items-center">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2">
                                                Property
                                            </span>
                                            {conversation.property_title}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate max-w-[180px] ${hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                            {conversation.last_message ? (
                                                conversation.last_message.text || 'Attachment'
                                            ) : (
                                                'No messages yet'
                                            )}
                                        </p>
                                        {hasUnread && (
                                            <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConversationList;
