import api from '@/lib/axios';

// ============================================================================
// Types
// ============================================================================

export interface Feature {
    id: number;
    name: string;
    code: string;
    description: string;
    status: 'active' | 'coming_soon' | 'disabled';
    is_active?: boolean; // deprecated
    created_at: string;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;  // Legacy field for backward compatibility
    price_monthly?: number;
    price_yearly?: number;
    duration_days: number;
    description: string;
    features: Feature[];
    feature_ids?: number[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AgentSubscription {
    id: number;
    username: string;
    email: string;
    agency_name: string | null;
    subscription_expires: string | null;
    verified: boolean;
}

export interface PlanStats {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    is_active: boolean;
    active_subscribers: number;
    total_subscribers: number;
    features_count: number;
}

export interface SubscriptionStats {
    total_plans: number;
    active_plans: number;
    plans: PlanStats[];
}

export interface AssignPlanResponse {
    message: string;
    agent: {
        id: number;
        username: string;
        email: string;
    };
    subscription: {
        plan: string;
        expires_at: string;
        features: string[];
    };
}

// ============================================================================
// Subscription Plans API
// ============================================================================

/**
 * Fetch all subscription plans
 * Admins see all plans, regular users see only active plans
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const res = await api.get<SubscriptionPlan[] | { results: SubscriptionPlan[] }>('/api/v1/features/plans/');
    // Handle both direct array and paginated response
    return Array.isArray(res.data) ? res.data : res.data.results || [];
}

/**
 * Fetch a single subscription plan by ID
 */
export async function fetchSubscriptionPlan(planId: number): Promise<SubscriptionPlan> {
    const res = await api.get(`/api/v1/features/plans/${planId}/`);
    return res.data;
}

/**
 * Create a new subscription plan (Admin only)
 */
export async function createSubscriptionPlan(data: {
    name: string;
    price: number;
    duration_days: number;
    description: string;
    feature_ids: number[];
    is_active?: boolean;
}): Promise<SubscriptionPlan> {
    const res = await api.post('/api/v1/features/plans/', data);
    return res.data;
}

/**
 * Update an existing subscription plan (Admin only)
 */
export async function updateSubscriptionPlan(
    planId: number,
    data: Partial<{
        name: string;
        price: number;
        duration_days: number;
        description: string;
        feature_ids: number[];
        is_active: boolean;
    }>
): Promise<SubscriptionPlan> {
    const res = await api.patch(`/api/v1/features/plans/${planId}/`, data);
    return res.data;
}

/**
 * Delete a subscription plan (Admin only)
 */
export async function deleteSubscriptionPlan(planId: number): Promise<void> {
    await api.delete(`/api/v1/features/plans/${planId}/`);
}

/**
 * Assign a subscription plan to an agent (Admin only)
 */
export async function assignPlanToAgent(
    planId: number,
    agentId: number
): Promise<AssignPlanResponse> {
    const res = await api.post(`/api/v1/features/plans/${planId}/assign_to_agent/`, {
        agent_id: agentId,
    });
    return res.data;
}

/**
 * Remove subscription plan from an agent (Admin only)
 */
export async function removePlanFromAgent(
    planId: number,
    agentId: number
): Promise<{ message: string }> {
    const res = await api.post(`/api/v1/features/plans/${planId}/remove_from_agent/`, {
        agent_id: agentId,
    });
    return res.data;
}

/**
 * Get list of agents subscribed to a plan (Admin only)
 */
export async function fetchPlanSubscribers(planId: number): Promise<{
    plan: string;
    total_subscribers: number;
    subscribers: AgentSubscription[];
}> {
    const res = await api.get(`/api/v1/features/plans/${planId}/subscribers/`);
    return res.data;
}

/**
 * Get subscription plan statistics (Admin only)
 */
export async function fetchSubscriptionStats(): Promise<SubscriptionStats> {
    const res = await api.get('/api/v1/features/plans/stats/');
    return res.data;
}

// ============================================================================
// Features API
// ============================================================================

/**
 * Fetch all features
 */
export async function fetchFeatures(): Promise<Feature[]> {
    const res = await api.get('/api/v1/features/features/?page_size=100');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
}

/**
 * Create a new feature (Admin only)
 */
export async function createFeature(data: {
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
}): Promise<Feature> {
    const res = await api.post('/api/v1/features/', data);
    return res.data;
}

/**
 * Update a feature (Admin only)
 */
export async function updateFeature(
    featureId: number,
    data: Partial<{
        name: string;
        code: string;
        description: string;
        is_active: boolean;
    }>
): Promise<Feature> {
    const res = await api.patch(`/api/v1/features/${featureId}/`, data);
    return res.data;
}

/**
 * Delete a feature (Admin only)
 */
export async function deleteFeature(featureId: number): Promise<void> {
    await api.delete(`/api/v1/features/${featureId}/`);
}

/**
 * Toggle feature active status (Admin only)
 */
export async function toggleFeatureStatus(featureId: number, isActive: boolean): Promise<Feature> {
    return updateFeature(featureId, { is_active: isActive });
}

// ============================================================================
// Agent Management API
// ============================================================================

export interface Agent {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    agent_profile?: {
        id: number;
        agency_name: string | null;
        phone: string | null;
        verified: boolean;
        subscription_active: boolean;
        subscription_expires: string | null;
    };
}

/**
 * Fetch all agents (Admin only)
 */
export async function fetchAgents(): Promise<Agent[]> {
    const res = await api.get<Agent[] | { results: Agent[] }>('/api/v1/accounts/users/?role=agent');
    // Handle both direct array and paginated response
    return Array.isArray(res.data) ? res.data : res.data.results || [];
}

/**
 * Fetch agent by ID (Admin only)
 */
export async function fetchAgent(agentId: number): Promise<Agent> {
    const res = await api.get(`/api/v1/accounts/users/${agentId}/`);
    return res.data;
}
