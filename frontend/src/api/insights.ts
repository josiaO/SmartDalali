import api from '@/lib/axios';

export interface DailyMetric {
    id: number;
    date: string;
    views: number;
    leads: number;
    conversions: number;
}

export interface DashboardInsights {
    kpis: {
        total_views: number;
        total_leads: number;
        total_conversions: number;
    };
    chart_data: DailyMetric[];
    ai_insights: string[];
}

export const getDashboardInsights = async (): Promise<DashboardInsights> => {
    const res = await api.get('/api/v1/insights/dashboard/');
    return res.data;
};
