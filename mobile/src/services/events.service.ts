import type { ApiResponse } from '../types/api';
import type { EventItem, EventListFilters } from '../types/event';

import { apiClient, publicApiClient } from './api';

export const getPublicEvents = async (params: EventListFilters = {}) => {
  const response = await publicApiClient.get<ApiResponse<EventItem[]>>('/events', {
    params,
  });

  return {
    items: response.data.data,
    meta: response.data.meta,
  };
};

export const searchPublicEvents = async (params: EventListFilters = {}) => {
  const response = await publicApiClient.get<ApiResponse<EventItem[]>>(
    '/events/search',
    {
      params,
    }
  );

  return {
    items: response.data.data,
    meta: response.data.meta,
  };
};

export const getPublicEventDetail = async (eventId: number) => {
  const response = await apiClient.get<ApiResponse<EventItem>>(`/events/${eventId}`);
  return response.data.data;
};
