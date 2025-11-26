export const USER_ROLES = {
  USER: 'user',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const PROPERTY_TYPES = [
  { value: 'House', label: 'House' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Office', label: 'Office' },
  { value: 'Land', label: 'Land' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Shop', label: 'Shop' },
  { value: 'Warehouse', label: 'Warehouse' },
] as const;

export const PROPERTY_STATUS = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
] as const;

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const;

export const ROUTES = {
  HOME: '/',
  PROPERTIES: '/properties',
  PROPERTY_DETAILS: '/properties/:id',
  PROPERTY_CREATE: '/properties/create',
  PROPERTY_EDIT: '/properties/:id/edit',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  AGENT_DASHBOARD: '/agent/dashboard',
  SUPPORT: '/support',
  SUPPORT_TICKET: '/support/:id',
  COMMUNICATIONS: '/communications',
  PAYMENTS: '/payments',
  PROFILE: '/profile',
} as const;
