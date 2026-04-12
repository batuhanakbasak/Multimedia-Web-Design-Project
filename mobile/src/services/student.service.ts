import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/auth';
import type { ApiMeta, ApiResponse } from '../types/api';
import type { ClubDetail, ClubItem } from '../types/club';
import type { StudentDashboard } from '../types/dashboard';
import type {
  EventItem,
  EventListFilters,
  JoinEventResponse,
} from '../types/event';
import type { User } from '../types/user';

import { apiClient } from './api';

export interface PaginatedItems<T> {
  items: T[];
  meta?: ApiMeta;
}

export const getStudentDashboard = async () => {
  const response = await apiClient.get<ApiResponse<StudentDashboard>>(
    '/student/dashboard'
  );
  return response.data.data;
};

export const getStudentEvents = async (params: EventListFilters = {}) => {
  const response = await apiClient.get<ApiResponse<EventItem[]>>('/student/events', {
    params,
  });

  return {
    items: response.data.data,
    meta: response.data.meta,
  } satisfies PaginatedItems<EventItem>;
};

export const searchStudentEvents = async (params: EventListFilters = {}) => {
  const response = await apiClient.get<ApiResponse<EventItem[]>>(
    '/student/events/search',
    {
      params,
    }
  );

  return {
    items: response.data.data,
    meta: response.data.meta,
  } satisfies PaginatedItems<EventItem>;
};

export const getStudentEventDetail = async (eventId: number) => {
  const response = await apiClient.get<ApiResponse<EventItem>>(
    `/student/events/${eventId}`
  );
  return response.data.data;
};

export const joinStudentEvent = async (eventId: number) => {
  const response = await apiClient.post<ApiResponse<JoinEventResponse>>(
    `/student/events/${eventId}/join`
  );
  return response.data.data;
};

export const leaveStudentEvent = async (eventId: number) => {
  const response = await apiClient.delete<ApiResponse<JoinEventResponse>>(
    `/student/events/${eventId}/leave`
  );
  return response.data.data;
};

export const getStudentMyEvents = async (params: EventListFilters = {}) => {
  const response = await apiClient.get<ApiResponse<EventItem[]>>(
    '/student/my-events',
    {
      params,
    }
  );

  return {
    items: response.data.data,
    meta: response.data.meta,
  } satisfies PaginatedItems<EventItem>;
};

export const getStudentFavorites = async () => {
  const response = await apiClient.get<ApiResponse<EventItem[]>>('/student/favorites');
  return response.data.data;
};

export const addStudentFavorite = async (eventId: number) => {
  const response = await apiClient.post<ApiResponse<EventItem | JoinEventResponse>>(
    `/student/favorites/${eventId}`
  );
  return response.data.data;
};

export const removeStudentFavorite = async (eventId: number) => {
  const response = await apiClient.delete<ApiResponse<EventItem | JoinEventResponse>>(
    `/student/favorites/${eventId}`
  );
  return response.data.data;
};

export const getStudentProfile = async () => {
  const response = await apiClient.get<ApiResponse<User>>('/student/profile');
  return response.data.data;
};

export const updateStudentProfile = async (payload: UpdateProfileRequest) => {
  const response = await apiClient.put<ApiResponse<User>>('/student/profile', payload);
  return response.data.data;
};

export const changeStudentPassword = async (payload: ChangePasswordRequest) => {
  const response = await apiClient.put<ApiResponse<{ password_changed: boolean }>>(
    '/student/profile/password',
    payload
  );
  return response.data.data;
};

export const getStudentClubs = async () => {
  const response = await apiClient.get<ApiResponse<ClubItem[]>>('/student/clubs');
  return response.data.data;
};

export const getStudentClubDetail = async (clubId: number) => {
  const response = await apiClient.get<ApiResponse<ClubDetail>>(
    `/student/clubs/${clubId}`
  );
  return response.data.data;
};
