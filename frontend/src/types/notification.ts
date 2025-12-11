export interface Notification {
    id: string; // UUID
    user: number;
    type: 'message' | 'visit' | 'support' | 'update';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    related_object_id?: number;
    related_object_type?: string;
    data?: any;
}
