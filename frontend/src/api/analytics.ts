import api from '@/lib/axios';

// TypeScript interfaces for analytics data

export interface PropertyPerformance {
    property_id: string;
    title: string;
    views_over_time: Array<{ date: string; views: number }>;
    total_views: number;
    likes: number;
    shares: number;
    contact_attempts: number;
    top_traffic_days: string[];
    device_breakdown: {
        mobile: number;
        desktop: number;
        tablet: number;
    };
}

export interface LeadInsights {
    new_messages_7d: number;
    new_messages_30d: number;
    conversations_started: number;
    avg_response_time: string;
    avg_response_time_seconds: number;
    most_inquired_property: {
        id: string;
        title: string;
        count: number;
    } | null;
}

export interface GeographicInsight {
    top_search_locations: Array<{ location: string; count: number }>;
    top_view_locations: Array<{ location: string; count: number }>;
}

export interface EngagementHeatmap {
    days: Array<{
        day: string;
        level: 'Low' | 'Medium' | 'High' | 'Very High';
    }>;
}

export interface OptimizationSuggestion {
    property_id?: string;
    property_title?: string;
    type: string;
    message: string;
}

export interface QuickWin {
    action: string;
    title: string;
    count?: number;
    property_id?: string;
    link: string;
}

export interface AgentStatsExtended {
    total_listings: number;
    active_listings: number;
    inactive_listings: number;
    total_views: number;
    views_7d: number;
    views_30d: number;
    total_inquiries: number;
    inquiries_7d: number;
    inquiries_30d: number;
    earnings: number;
    recent_viewers: any[];
    recent_reviews: any[];
    most_viewed: any[];
    most_liked: any[];
}

// API Functions

/**
 * Get extended agent stats with time-filtered metrics
 */
export const getAgentStatsExtended = async (): Promise<AgentStatsExtended> => {
    const response = await api.get('/api/v1/properties/agent-stats/');
    return response.data;
};

/**
 * Get detailed per-property performance metrics
 * @param propertyId - Optional specific property ID
 * @param days - Number of days to analyze (default: 30)
 */
export const getPropertyPerformance = async (
    propertyId?: string,
    days: number = 30
): Promise<PropertyPerformance[]> => {
    const params: any = { days };
    if (propertyId) {
        params.property_id = propertyId;
    }

    const response = await api.get('/api/v1/properties/analytics/property-performance/', { params });
    return response.data;
};

/**
 * Get lead and buyer behavior metrics
 * @param days - Number of days to analyze (default: 30)
 */
export const getLeadInsights = async (days: number = 30): Promise<LeadInsights> => {
    const response = await api.get('/api/v1/properties/analytics/lead-insights/', {
        params: { days }
    });
    return response.data;
};

/**
 * Get location-based insights
 * @param days - Number of days to analyze (default: 30)
 */
export const getGeographicInsights = async (days: number = 30): Promise<GeographicInsight> => {
    const response = await api.get('/api/v1/properties/analytics/geographic/', {
        params: { days }
    });
    return response.data;
};

/**
 * Get weekly engagement pattern heatmap
 */
export const getEngagementHeatmap = async (): Promise<EngagementHeatmap> => {
    const response = await api.get('/api/v1/properties/analytics/engagement-heatmap/');
    return response.data;
};

/**
 * Get automatic listing improvement suggestions
 */
export const getOptimizationSuggestions = async (): Promise<OptimizationSuggestion[]> => {
    const response = await api.get('/api/v1/properties/analytics/optimization-suggestions/');
    return response.data;
};

/**
 * Get actionable quick-win items
 */
export const getQuickWins = async (): Promise<QuickWin[]> => {
    const response = await api.get('/api/v1/properties/analytics/quick-wins/');
    return response.data;
};
