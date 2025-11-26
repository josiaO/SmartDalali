import { useAuth } from '@/hooks/useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'inactive' | 'cancelled';
  expires_at: string | null;
  created_at: string | null;
}

export function useSubscription() {
  const { user, loading } = useAuth();

  const agentProfile = user?.agent_profile;
  const currentPlan = agentProfile?.current_plan;

  const subscription: Subscription | null = agentProfile && currentPlan ? {
    id: currentPlan.id.toString(),
    user_id: user.id,
    plan_type: currentPlan.name.toLowerCase().includes('annual') ? 'annual' : 'monthly',
    status: agentProfile.subscription_active ? 'active' : 'inactive',
    expires_at: agentProfile.subscription_expires,
    created_at: null, // Not available in agent_profile, but usually not critical for display
  } : null;

  const hasActiveSubscription = agentProfile?.subscription_active || false;

  const isSubscriptionExpired = agentProfile?.subscription_expires
    ? new Date(agentProfile.subscription_expires) < new Date()
    : false;

  return {
    subscription,
    hasActiveSubscription: hasActiveSubscription && !isSubscriptionExpired,
    isSubscriptionExpired,
    isLoading: loading,
  };
}
