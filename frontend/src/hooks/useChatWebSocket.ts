import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useChatWebSocket(conversationId: number | null) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef<WebSocket | null>(null);

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !conversationId) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).host
            : 'localhost:8000';

        // Connect to specific chat room
        const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`Chat ${conversationId} WebSocket Connected`);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Chat WS Message:', data);

                if (data.type === 'message') {
                    // New message received
                    // Invalidate/Update React Query
                    // We can push to the existing cache:
                    queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
                        if (!oldData) return oldData;

                        const newMessage = data.message;
                        const results = Array.isArray(oldData.results) ? oldData.results : (Array.isArray(oldData) ? oldData : []);

                        // Avoid duplicates
                        if (results.some((m: any) => m.id === newMessage.id)) return oldData;

                        // Assume results are ordered? API usually returns ordered.
                        // We should append the new message.
                        // If the API returns paginated structure { count, next, previous, results: [...] }
                        if (oldData.results) {
                            return {
                                ...oldData,
                                results: [...oldData.results, newMessage]
                            };
                        }

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
