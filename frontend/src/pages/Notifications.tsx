import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Check, Mail, Calendar, Info, Clock, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
    const { notifications, markAllAsRead, markAsRead, deleteNotification, fetchNotifications } = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigation Logic
        if (notification.type === 'message') {
            if (notification.related_object_id) {
                navigate('/communication', { state: { conversationId: notification.related_object_id } });
            } else {
                navigate('/communication');
            }
        }
        // Add other types as needed
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <Mail className="text-blue-500" size={20} />;
            case 'visit': return <Calendar className="text-green-500" size={20} />;
            case 'support': return <Info className="text-purple-500" size={20} />;
            default: return <Info className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 transition-colors">
            <PublicHeader />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay updated with your latest activities</p>
                    </div>

                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <Check size={16} className="mr-2" />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Unread Section */}
                    {notifications.some(n => !n.is_read) && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">New</h2>
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
                                {notifications.filter(n => !n.is_read).map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="p-5 flex gap-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group relative"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                        <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 pr-4">{notification.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">New</span>
                                                    <button
                                                        onClick={(e) => handleDelete(e, notification.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{notification.message}</p>
                                            <div className="flex items-center mt-2 text-xs text-gray-400">
                                                <Clock size={12} className="mr-1" />
                                                {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Read/Earlier Section */}
                    {notifications.filter(n => n.is_read).length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">Earlier</h2>
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
                                {notifications.filter(n => n.is_read).map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="p-5 flex gap-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group opacity-75 hover:opacity-100"
                                    >
                                        <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center grayscale dark:grayscale-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-base font-medium text-gray-900 dark:text-gray-200">{notification.title}</h3>
                                                <button
                                                    onClick={(e) => handleDelete(e, notification.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{notification.message}</p>
                                            <div className="flex items-center mt-2 text-xs text-gray-400">
                                                {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {notifications.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BellIcon className="text-gray-300 dark:text-gray-600" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">We'll notify you when something important happens.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Helper Icon
function BellIcon({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

export default Notifications;
