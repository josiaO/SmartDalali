import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from './firebase';

// Initialize Analytics
const analytics = getAnalytics(app);

// Analytics Event Types
export enum AnalyticsEvent {
    // Page Views
    PAGE_VIEW = 'page_view',

    // Dashboard Events
    DASHBOARD_VIEW = 'dashboard_view',
    KPI_CARD_CLICK = 'kpi_card_click',

    // Property Performance
    PROPERTY_PERFORMANCE_VIEW = 'property_performance_view',
    PROPERTY_DETAILS_CLICK = 'property_details_click',

    // Lead Insights
    LEAD_INSIGHTS_VIEW = 'lead_insights_view',

    // Geographic
    GEOGRAPHIC_VIEW = 'geographic_view',

    // Engagement Heatmap
    HEATMAP_VIEW = 'heatmap_view',

    // Optimization
    OPTIMIZATION_SUGGESTION_VIEW = 'optimization_suggestion_view',
    OPTIMIZATION_ACTION_CLICK = 'optimization_action_click',

    // Quick Wins
    QUICK_WIN_VIEW = 'quick_win_view',
    QUICK_WIN_ACTION_CLICK = 'quick_win_action_click',
}

// Track page view
export const trackPageView = (pageName: string, pageTitle?: string) => {
    logEvent(analytics, AnalyticsEvent.PAGE_VIEW, {
        page_name: pageName,
        page_title: pageTitle || pageName,
        timestamp: new Date().toISOString(),
    });
};

// Track dashboard view
export const trackDashboardView = (userRole: string) => {
    logEvent(analytics, AnalyticsEvent.DASHBOARD_VIEW, {
        user_role: userRole,
        timestamp: new Date().toISOString(),
    });
};

// Track KPI card interaction
export const trackKPICardClick = (cardName: string, value: number | string) => {
    logEvent(analytics, AnalyticsEvent.KPI_CARD_CLICK, {
        card_name: cardName,
        card_value: value,
        timestamp: new Date().toISOString(),
    });
};

// Track property performance view
export const trackPropertyPerformanceView = (propertyCount: number) => {
    logEvent(analytics, AnalyticsEvent.PROPERTY_PERFORMANCE_VIEW, {
        property_count: propertyCount,
        timestamp: new Date().toISOString(),
    });
};

// Track property details click
export const trackPropertyDetailsClick = (propertyId: string, propertyTitle: string) => {
    logEvent(analytics, AnalyticsEvent.PROPERTY_DETAILS_CLICK, {
        property_id: propertyId,
        property_title: propertyTitle,
        timestamp: new Date().toISOString(),
    });
};

// Track optimization suggestion actions
export const trackOptimizationAction = (suggestionType: string, propertyId?: string) => {
    logEvent(analytics, AnalyticsEvent.OPTIMIZATION_ACTION_CLICK, {
        suggestion_type: suggestionType,
        property_id: propertyId || 'none',
        timestamp: new Date().toISOString(),
    });
};

// Track quick win actions
export const trackQuickWinAction = (actionType: string, actionTitle: string) => {
    logEvent(analytics, AnalyticsEvent.QUICK_WIN_ACTION_CLICK, {
        action_type: actionType,
        action_title: actionTitle,
        timestamp: new Date().toISOString(),
    });
};

// Set user properties
export const setAnalyticsUser = (userId: string, userProperties?: Record<string, unknown>) => {
    setUserId(analytics, userId);
    if (userProperties) {
        setUserProperties(analytics, userProperties);
    }
};

// Generic event tracker
export const trackCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
    logEvent(analytics, eventName, {
        ...params,
        timestamp: new Date().toISOString(),
    });
};

export default analytics;
