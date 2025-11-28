import type { UserRole } from '@/contexts/AuthContext';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiresSubscription?: boolean;
}

export const FEATURES = {
  // Property Management
  CREATE_PROPERTY: 'create_property',
  EDIT_PROPERTY: 'edit_property',
  DELETE_PROPERTY: 'delete_property',

  // Analytics & Insights
  VIEW_ANALYTICS: 'view_analytics',

  // User Management (Admin)
  MANAGE_USERS: 'manage_users',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  VIEW_ALL_PROPERTIES: 'view_all_properties',

  // Communication
  MESSAGING: 'messaging', // Access to messaging system
  ADVANCED_MESSAGING: 'advanced_messaging', // Advanced messaging features
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

interface PermissionConfig {
  roles: UserRole[];
  requiresSubscription?: boolean;
  description: string;
}

const PERMISSION_CONFIG: Record<Feature, PermissionConfig> = {
  [FEATURES.CREATE_PROPERTY]: {
    roles: ['agent'],
    requiresSubscription: false, // ✅ No subscription needed
    description: 'Create new property listings',
  },
  [FEATURES.EDIT_PROPERTY]: {
    roles: ['agent'],
    requiresSubscription: false, // ✅ No subscription needed
    description: 'Edit existing property listings',
  },
  [FEATURES.DELETE_PROPERTY]: {
    roles: ['agent', 'admin'],
    requiresSubscription: false,
    description: 'Delete property listings',
  },
  [FEATURES.VIEW_ANALYTICS]: {
    roles: ['agent', 'admin'],
    requiresSubscription: false, // ✅ Analytics available to all agents
    description: 'Access detailed analytics and insights',
  },
  [FEATURES.MANAGE_USERS]: {
    roles: ['admin'],
    requiresSubscription: false,
    description: 'Manage user accounts and roles',
  },
  [FEATURES.MANAGE_SUBSCRIPTIONS]: {
    roles: ['admin'],
    requiresSubscription: false,
    description: 'Manage agent subscriptions',
  },
  [FEATURES.VIEW_ALL_PROPERTIES]: {
    roles: ['admin'],
    requiresSubscription: false,
    description: 'View all properties in the system',
  },
  [FEATURES.MESSAGING]: {
    roles: ['agent', 'user'],
    requiresSubscription: false, // ✅ Messaging available to all
    description: 'Access messaging system',
  },
  [FEATURES.ADVANCED_MESSAGING]: {
    roles: ['agent'],
    requiresSubscription: false, // ✅ Advanced messaging available to all agents
    description: 'Access advanced messaging features',
  },
};

export function checkPermission(
  feature: Feature,
  userRole?: UserRole,
  hasActiveSubscription?: boolean
): PermissionCheck {
  const config = PERMISSION_CONFIG[feature];

  if (!config) {
    return {
      allowed: false,
      reason: 'Unknown feature',
    };
  }

  // Check role permission
  if (!userRole || !config.roles.includes(userRole)) {
    return {
      allowed: false,
      reason: 'Insufficient permissions',
    };
  }

  // Check subscription requirement (only for agents)
  if (config.requiresSubscription && userRole === 'agent') {
    if (!hasActiveSubscription) {
      return {
        allowed: false,
        reason: 'Active subscription required',
        requiresSubscription: true,
      };
    }
  }

  return {
    allowed: true,
  };
}

export function getFeatureDescription(feature: Feature): string {
  return PERMISSION_CONFIG[feature]?.description || '';
}

export function requiresSubscription(feature: Feature): boolean {
  return PERMISSION_CONFIG[feature]?.requiresSubscription || false;
}
