import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConversationList from '../../components/messaging/ConversationList';
import ChatRoom from '../../components/messaging/ChatRoom';
import { messagingService, Conversation } from '../../api/messaging';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ConversationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for "start conversation" intent from other pages
  useEffect(() => {
    const initConversation = async () => {
      const state = location.state as { recipientId?: number; propertyId?: number } | null;

      if (state?.recipientId) {
        try {
          setLoading(true);
          const convo = await messagingService.startConversation(state.recipientId, state.propertyId);
          setSelectedConversation(convo);
          // Clear state so refresh doesn't re-trigger? 
          // Actually navigating to same path cleans state typically, but good to be safe.
          // We can replace historyState if needed, but likely fine.
        } catch (error) {
          console.error("Failed to start conversation", error);
        } finally {
          setLoading(false);
        }
      }
    };

    initConversation();
  }, [location.state]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-slate-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedId={selectedConversation?.id}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <ChatRoom
            conversation={selectedConversation}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-lg font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
