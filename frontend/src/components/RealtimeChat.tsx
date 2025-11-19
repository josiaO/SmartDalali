/**
 * Real-time Chat Component with WebSocket support
 */

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealtimeChatProps {
  conversationId: number;
  currentUserId: number;
  onNewMessage?: () => void;
}

export default function RealtimeChat({
  conversationId,
  currentUserId,
  onNewMessage,
}: RealtimeChatProps) {
  const { toast } = useToast();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    error,
    typingUsers,
    readReceipts,
    messages,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect,
  } = useChat(conversationId);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Connection Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Stop typing after 2 seconds of inactivity
    setTypingTimeout(
      setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 2000)
    );
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please wait for the connection to be established',
        variant: 'destructive',
      });
      return;
    }

    const success = sendMessage(messageInput);

    if (success) {
      setMessageInput('');
      setIsTyping(false);
      sendTypingIndicator(false);
      onNewMessage?.();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mark messages as read
  useEffect(() => {
    messages.forEach((msg) => {
      if (
        msg.type === 'message' &&
        'sender_id' in msg &&
        msg.sender_id !== currentUserId &&
        !msg.is_read
      ) {
        sendReadReceipt(msg.id);
      }
    });
  }, [messages, currentUserId, sendReadReceipt]);

  const getTypingText = () => {
    const typers = Array.from(typingUsers.keys()).filter((id) => id !== currentUserId);
    if (typers.length === 0) return null;
    if (typers.length === 1) return 'Someone is typing...';
    return `${typers.length} people are typing...`;
  };

  const isMessageRead = (messageId: number): boolean => {
    const receipts = readReceipts.get(messageId);
    return receipts ? receipts.size > 0 : false;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {!isConnected && (
          <Button
            size="sm"
            variant="outline"
            onClick={reconnect}
            className="ml-auto"
          >
            Reconnect
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 border rounded-lg p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              if (msg.type !== 'message') return null;
              
              const isOwnMessage = 'sender_id' in msg && msg.sender_id === currentUserId;
              const isRead = 'id' in msg && isMessageRead(msg.id);

              return (
                <div
                  key={idx}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">
                      {'content' in msg ? msg.content : ''}
                    </p>
                    <div
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                      }`}
                    >
                      {new Date(
                        'created_at' in msg ? msg.created_at : Date.now()
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {isOwnMessage && isRead && ' ✓✓'}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {getTypingText() && (
            <div className="flex gap-2 text-gray-500 text-sm">
              <span>{getTypingText()}</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!isConnected || !messageInput.trim()}
        >
          {!isConnected && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Send
        </Button>
      </div>
    </div>
  );
}
