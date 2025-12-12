import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useChatWebSocket(conversationId: number | null) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef<WebSocket | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const isManualClose = useRef(false);

    const getReconnectDelay = useCallback((attempt: number) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        return Math.min(1000 * Math.pow(2, attempt), 30000);
    }, []);

    const connect = useCallback(() => {
        if (!isAuthenticated || !conversationId) {
            console.log('WebSocket connect skipped: Not authenticated or no conversationId');
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('No auth token available');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).host
            : 'localhost:8000';

        // Connect to specific chat room
        const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/?token=${token}`;

        // If it's a flat array
        return [...results, newMessage];
    });

    // Also update conversations list "last_message"
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
} else if (data.type === 'read.receipt') {
    // Mark message as read in cache
    queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return oldData;
        const results = Array.isArray(oldData.results) ? oldData.results : (Array.isArray(oldData) ? oldData : []);

        const newResults = results.map((m: any) => {
            if (m.id === data.message_id) {
                return { ...m, is_read: true };
            }
            return m;
        });

        if (oldData.results) {
            return { ...oldData, results: newResults };
        }
        return newResults;
    });
}
            } catch (e) {
    console.error('Chat WS Parse Error', e);
}
        };

ws.onclose = () => {
    console.log(`Chat ${conversationId} WebSocket Disconnected`);
    setIsConnected(false);
};

socketRef.current = ws;

return () => {
    if (socketRef.current) {
        socketRef.current.close();
    }
};
    }, [isAuthenticated, conversationId, queryClient]);

const sendMessage = (content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: 'message',
            content: content
        }));
    } else {
        console.warn('Chat WS not open');
        // Fallback to REST API is handled by useSendMessage hook in UI
        // But we could throw error here
    }
};

return { sendMessage, isConnected };
}
