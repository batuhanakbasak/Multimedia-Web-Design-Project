const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : 'https://api.batuhanakbasak.com/api';

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_LIST_LIMIT = 12;
export const REQUEST_TIMEOUT = 15000;

export const STORAGE_KEYS = {
  accessToken: 'gadsum_mobile_access_token',
  refreshToken: 'gadsum_mobile_refresh_token',
  user: 'gadsum_mobile_user',
} as const;

export const QUERY_DEFAULTS = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  sort: 'upcoming',
} as const;

export const EVENT_CATEGORIES = [
  'Technology',
  'Career',
  'Workshop',
  'Social',
  'Sports',
  'Academic',
  'Community',
  'Arts',
] as const;

export const EVENT_SORT_OPTIONS = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
] as const;

export const EVENT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Passed', value: 'passed' },
] as const;
