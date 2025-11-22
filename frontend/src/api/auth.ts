import api from '@/lib/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/lib/constants';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface GoogleAuthPayload {
    id_token: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user?: any;
}

export interface UserProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'user' | 'agent' | 'superuser';
    phone_number?: string;
    profile_picture?: string;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
}

/**
 * Login with Google OAuth token
 */
export async function googleLogin(payload: GoogleAuthPayload): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, payload);
    return response.data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    try {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
        // Clear tokens regardless of API response
        clearTokens();
    }
}

/**
 * Refresh access token
 */
export async function refreshToken(refresh: string): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, { refresh });
    return response.data;
}

/**
 * Get current user profile
 */
export async function fetchMe(): Promise<UserProfile> {
    const response = await api.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
}

/**
 * Save auth tokens to localStorage
 */
export function saveTokens(access: string, refresh: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    // Update axios default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
}

/**
 * Clear auth tokens from localStorage
 */
export function clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    // Remove axios default headers
    delete api.defaults.headers.common['Authorization'];
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getAccessToken();
}
