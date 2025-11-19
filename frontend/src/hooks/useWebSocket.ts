/**
 * Custom React hook for WebSocket functionality
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import websocketService, { 
  WebSocketMessage, 
  Message as WSMessage,
  TypingIndicator,
  ReadReceipt,
  Notification,
  ErrorMessage
} from '@/services/websocket';

export interface UseWebSocketOptions {
  conversationId?: number;
  autoConnect?: boolean;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: (code: number) => void;
  onError?: (error: Event) => void;
}

/**
 * Hook for managing WebSocket connections and messaging
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    conversationId,
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, boolean>>(new Map());
  const [readReceipts, setReadReceipts] = useState<Map<number, Set<number>>>(new Map());
  
  const handlersRef = useRef({
    onMessage: onMessage,
    onConnect: onConnect,
    onDisconnect: onDisconnect,
    onError: onError,
  });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = {
      onMessage,
      onConnect,
      onDisconnect,
      onError,
    };
  }, [onMessage, onConnect, onDisconnect, onError]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!autoConnect) return;

    const connectWebSocket = async () => {
      try {
        if (conversationId) {
          await websocketService.connectToChat(conversationId);
        } else {
          await websocketService.connectToNotifications();
        }
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('WebSocket connection failed:', err);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (conversationId) {
        websocketService.disconnectChat();
      } else {
        websocketService.disconnectNotifications();
      }
      setIsConnected(false);
    };
  }, [autoConnect, conversationId]);

  // Handle messages from WebSocket
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    // Handle specific message types
    if (message.type === 'typing') {
      const typingMsg = message as TypingIndicator;
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        if (typingMsg.is_typing) {
          updated.set(typingMsg.user_id, true);
        } else {
          updated.delete(typingMsg.user_id);
        }
        return updated;
      });
    } else if (message.type === 'read_receipt') {
      const receipt = message as ReadReceipt;
      setReadReceipts((prev) => {
        const updated = new Map(prev);
        if (!updated.has(receipt.message_id)) {
          updated.set(receipt.message_id, new Set());
        }
        updated.get(receipt.message_id)!.add(receipt.user_id);
        return updated;
      });
    }

    // Call user's custom handler
    if (handlersRef.current.onMessage) {
      handlersRef.current.onMessage(message);
    }
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    if (handlersRef.current.onConnect) {
      handlersRef.current.onConnect();
    }
  }, []);

  const handleDisconnect = useCallback((code: number) => {
    setIsConnected(false);
    if (handlersRef.current.onDisconnect) {
      handlersRef.current.onDisconnect(code);
    }
  }, []);

  const handleError = useCallback((err: Event) => {
    const error = err instanceof Error ? err : new Error('WebSocket error');
    setError(error);
    if (handlersRef.current.onError) {
      handlersRef.current.onError(err);
    }
  }, []);

  // Register event handlers with the service
  useEffect(() => {
    websocketService.onMessage(handleWebSocketMessage);
    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onError(handleError);

    return () => {
      websocketService.offMessage(handleWebSocketMessage);
      websocketService.offConnect(handleConnect);
      websocketService.offDisconnect(handleDisconnect);
      websocketService.offError(handleError);
    };
  }, [handleWebSocketMessage, handleConnect, handleDisconnect, handleError]);

  // Send message
  const sendMessage = useCallback((content: string) => {
    if (!isConnected) {
      console.warn('WebSocket is not connected');
      return false;
    }
    websocketService.sendMessage(content);
    return true;
  }, [isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!isConnected) return;
    websocketService.sendTypingIndicator(isTyping);
  }, [isConnected]);

  // Send read receipt
  const sendReadReceipt = useCallback((messageId: number) => {
    if (!isConnected) return;
    websocketService.sendReadReceipt(messageId);
  }, [isConnected]);

  // Reconnect manually
  const reconnect = useCallback(async () => {
    try {
      if (conversationId) {
        await websocketService.connectToChat(conversationId);
      } else {
        await websocketService.connectToNotifications();
      }
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Reconnection failed');
      setError(error);
      throw error;
    }
  }, [conversationId]);

  return {
    isConnected,
    error,
    typingUsers,
    readReceipts,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect,
  };
}

/**
 * Hook for managing chat-specific WebSocket functionality
 */
export function useChat(conversationId: number) {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  
  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === 'message') {
      setMessages((prev) => [...prev, message as WSMessage]);
    }
  }, []);

  const websocket = useWebSocket({
    conversationId,
    autoConnect: true,
    onMessage: handleMessage,
  });

  return {
    ...websocket,
    messages,
    clearMessages: () => setMessages([]),
  };
}

/**
 * Hook for managing notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === 'notification') {
      const notification = message as Notification;
      setNotifications((prev) => [...prev, notification]);
      
      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n !== notification));
      }, 5000);
    }
  }, []);

  const websocket = useWebSocket({
    autoConnect: true,
    onMessage: handleMessage,
  });

  const clearNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => prev.filter((n) => n !== notification));
  }, []);

  return {
    ...websocket,
    notifications,
    clearNotification,
    clearAllNotifications: () => setNotifications([]),
  };
}
