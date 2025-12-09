import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WebSocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    sendMessage: (data: any) => void;
    lastMessage: any;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const connect = () => {
        if (!isAuthenticated) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).host
            : 'localhost:8000';

        // Connect to notification channel by default for all users
        // We can also handle chat connections dynamically or use a single multiplexed connection if backend supports it.
        // Based on routing.py, we have:
        // ws/notifications/ -> NotificationConsumer
        // ws/chat/:id/ -> ChatConsumer

        // For now, let's connect to notifications as a baseline, but Chat requires per-room connection.
        // Actually, creating a single global socket for everything is complex if backend separates them.
        // Let's implement a "Connection Manager" style or just expose methods to connect to specific chats?

        // WAIT: The user wants "Real-time updates" for chat.
        // ChatConsumer requires conversation_id in URL.
        // So we can't have ONE global socket for all chats unless we change backend.
        // BUT we can have a global "Notification" socket for new message ALERTS (if backend supports it).
        // usage of NotificationConsumer in backend: "Send notification to WebSocket". 
        // It seems NotificationConsumer sends 'notification' events.

        // Let's implement a global Notification socket here. 
        // And for Chat, we will handle it in the component or via a hook that opens a separate socket.

        // Refined Plan:
        // 1. WebSocketProvider manages the "Notification" socket (for global alerts, unread counts).
        // 2. Chat component manages the "Chat" socket (specifically for that room's messages).

        const wsUrl = `${protocol}//${host}/ws/notifications/?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Notification WebSocket Connected');
            setIsConnected(true);
            // Clear any reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = undefined;
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message:', data);
                setLastMessage(data);

                // Handle global notifications here if needed, e.g. toast
                if (data.type === 'notification') {
                    // Optional: toast(data.message);
                }
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        ws.onclose = () => {
            console.log('Notification WebSocket Disconnected');
            setIsConnected(false);
            socketRef.current = null;

            // Reconnect after delay
            if (!reconnectTimeoutRef.current && isAuthenticated) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('WS Error', error);
            ws.close();
        };

        socketRef.current = ws;
    };

    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else {
            socketRef.current?.close();
        }

        return () => {
            socketRef.current?.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [isAuthenticated]);

    const sendMessage = (data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn('WS not open');
        }
    };

    return (
        <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected, sendMessage, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
