// Feature flags for launch mode
export const FEATURES = {
    MESSAGING_ENABLED: false,
    PAYMENTS_ENABLED: false,
    AUDIO_VIDEO_ENABLED: false,
} as const;

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/api/v1/accounts/auth/token/',
        GOOGLE_LOGIN: '/api/v1/accounts/firebase-login/',
        LOGOUT: '/api/v1/accounts/auth/logout/',
        REFRESH: '/api/v1/accounts/auth/token/refresh/',
        ME: '/api/v1/accounts/me/',
        PROFILE: '/api/v1/accounts/profile/',
        UPDATE_PROFILE: '/api/v1/accounts/profile/update/',
        REGISTER: '/api/v1/accounts/auth/register/',
        SIGNUP: '/api/v1/accounts/auth/signup/',
    },
    // Properties
    PROPERTIES: {
        LIST: '/api/v1/properties/',
        DETAIL: (id: string) => `/api/v1/properties/${id}/`,
        CREATE: '/api/v1/properties/',
        UPDATE: (id: string) => `/api/v1/properties/${id}/`,
        DELETE: (id: string) => `/api/v1/properties/${id}/`,
        GEOCODE: '/api/v1/properties/geocode/',
    },
    // Visits
    VISITS: {
        LIST: '/api/v1/properties/visits/',
        DETAIL: (id: string) => `/api/v1/properties/visits/${id}/`,
    },
    // Support
    SUPPORT: {
        TICKETS: '/api/v1/properties/support/tickets/',
        TICKET: (id: string) => `/api/v1/properties/support/tickets/${id}/`,
        REPLY: (id: string) => `/api/v1/properties/support/tickets/${id}/reply/`,
    },
    // Communications
    COMMUNICATIONS: {
        CONVERSATIONS: '/api/v1/communications/conversations/',
        CONVERSATION: (id: string) => `/api/v1/communications/conversations/${id}/`,
        MESSAGES: '/api/v1/communications/messages/',
        MESSAGE: (id: string) => `/api/v1/communications/messages/${id}/`,
        NOTIFICATIONS: '/api/v1/communications/notifications/',
    },
    // Payments
    PAYMENTS: {
        LIST: '/api/v1/properties/payments/',
        INITIATE: (propertyId: string) => `/api/v1/properties/payments/mpesa/stk/${propertyId}/`,
        STATUS: (paymentId: string) => `/api/v1/properties/payments/status/${paymentId}/`,
        CALLBACK: '/api/v1/properties/payments/mpesa/callback/',
    },
} as const;

// Routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    GOOGLE_CALLBACK: '/auth/google/callback',

    // Properties
    PROPERTIES: '/properties',
    PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
    PROPERTY_CREATE: '/properties/create',
    PROPERTY_EDIT: (id: string) => `/properties/${id}/edit`,

    // Dashboards
    USER_DASHBOARD: '/dashboard/user',
    AGENT_DASHBOARD: '/dashboard/agent',

    // Communication
    CONVERSATIONS: '/communication',
    CHAT_ROOM: (id: string) => `/communication/${id}`,

    // Support
    SUPPORT: '/support',
    TICKET_DETAIL: (id: string) => `/support/${id}`,

    // Payments
    SUBSCRIPTION: '/payments/subscription',

    // Misc
    NOT_FOUND: '/404',
    COMING_SOON: '/coming-soon',
} as const;

// User Roles
export const USER_ROLES = {
    SUPERUSER: 'superuser',
    AGENT: 'agent',
    USER: 'user',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
    COMING_SOON: {
        title: 'Coming Soon',
        description: 'This feature will be available soon!',
    },
    MESSAGING_DISABLED: {
        title: 'Messaging Coming Soon',
        description: 'Real-time messaging will be available in the next update.',
    },
    PAYMENTS_DISABLED: {
        title: 'Payments Coming Soon',
        description: 'M-Pesa payment integration will be available soon.',
    },
    LOGIN_SUCCESS: {
        title: 'Welcome back',
        description: 'You have successfully logged in.',
    },
    LOGIN_ERROR: {
        title: 'Login failed',
        description: 'Please check your credentials and try again.',
    },
    UNAUTHORIZED: {
        title: 'Unauthorized',
        description: 'You do not have permission to access this resource.',
    },
} as const;
