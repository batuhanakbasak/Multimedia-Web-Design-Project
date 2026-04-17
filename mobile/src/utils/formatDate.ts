import { theme } from '../constants/theme';
import type { TimelineStatus } from '../types/event';

const DEFAULT_LOCALE = 'en-US';

export const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatShortDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
};

export const getStatusLabel = (status?: string | null) => {
  switch (status as TimelineStatus | undefined) {
    case 'active':
      return 'Active';
    case 'passed':
      return 'Passed';
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }
};

export const getStatusColor = (status?: string | null) => {
  switch (status as TimelineStatus | undefined) {
    case 'active':
      return {
        backgroundColor: theme.colors.primarySoft,
        color: theme.colors.primaryDeep,
        borderColor: '#b9e5e1',
      };
    case 'cancelled':
      return {
        backgroundColor: theme.colors.dangerSoft,
        color: theme.colors.danger,
        borderColor: '#f0c8c8',
      };
    case 'completed':
      return {
        backgroundColor: theme.colors.successSoft,
        color: theme.colors.success,
        borderColor: '#c9e5d5',
      };
    case 'passed':
      return {
        backgroundColor: theme.colors.warningSoft,
        color: theme.colors.warning,
        borderColor: '#efd4aa',
      };
    default:
      return {
        backgroundColor: theme.colors.surfaceMuted,
        color: theme.colors.textMuted,
        borderColor: theme.colors.border,
      };
  }
};
