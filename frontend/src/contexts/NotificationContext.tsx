import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext'; // Assuming this exists, based on file list
import { Notification } from '../types/notification';
import api from '../lib/axios';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { lastMessage } = useWebSocket(); // Assuming WebSocketContext provides lastMessage or similar hook
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const response = await api.get('/api/v1/communications/notifications/');
            // Handle pagination (Django REST Framework default)
            const results = Array.isArray(response.data) ? response.data : response.data.results || [];
            setNotifications(results);
            setUnreadCount(results.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    // Handle real-time updates
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'notification.message') {
            const newNotification = lastMessage.message;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Pop sound or visual cue could go here
            if ('Notification' in window && window.Notification.permission === 'granted') {
                // Browser notification if allowed
                new window.Notification(newNotification.title, { body: newNotification.message });
            }
        }
    }, [lastMessage]);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/api/v1/communications/notifications/${id}/mark_read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/v1/communications/notifications/mark-all-read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/api/v1/communications/notifications/${id}/`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => {
                const notification = notifications.find(n => n.id === id);
                return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
            });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
