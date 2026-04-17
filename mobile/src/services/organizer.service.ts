import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/auth';
import type { ApiResponse } from '../types/api';
import type { ClubItem, ClubMember, SaveClubMemberPayload } from '../types/club';
import type { OrganizerDashboard } from '../types/dashboard';
import type {
  EventItem,
  EventListFilters,
  EventParticipant,
  OrganizerEventPayload,
} from '../types/event';
import type { User } from '../types/user';

import { apiClient } from './api';

export const getOrganizerDashboard = async () => {
  const response = await apiClient.get<ApiResponse<OrganizerDashboard>>(
    '/organizer/dashboard'
  );
  return response.data.data;
};

export const getOrganizerEvents = async (params: EventListFilters = {}) => {
  const response = await apiClient.get<ApiResponse<EventItem[]>>('/organizer/events', {
    params,
  });

  return {
    items: response.data.data,
    meta: response.data.meta,
  };
};

export const getOrganizerEventDetail = async (eventId: number) => {
  const response = await apiClient.get<ApiResponse<EventItem>>(
    `/organizer/events/${eventId}`
  );
  return response.data.data;
};

export const createOrganizerEvent = async (payload: OrganizerEventPayload) => {
  const response = await apiClient.post<ApiResponse<EventItem>>(
    '/organizer/events',
    payload
  );
  return response.data.data;
};

export const updateOrganizerEvent = async (
  eventId: number,
  payload: Partial<OrganizerEventPayload>
) => {
  const response = await apiClient.put<ApiResponse<EventItem>>(
    `/organizer/events/${eventId}`,
    payload
  );
  return response.data.data;
};

export const cancelOrganizerEvent = async (eventId: number) => {
  const response = await apiClient.delete<ApiResponse<{ event_id: number; status: string }>>(
    `/organizer/events/${eventId}`
  );
  return response.data.data;
};

export const getOrganizerParticipants = async (eventId: number) => {
  const response = await apiClient.get<ApiResponse<EventParticipant[]>>(
    `/organizer/events/${eventId}/participants`
  );
  return response.data.data;
};

export const removeOrganizerParticipant = async (eventId: number, userId: number) => {
  const response = await apiClient.delete<
    ApiResponse<{ id: number; event_id: number; user_id: number; status: string; joined_count: number }>
  >(`/organizer/events/${eventId}/participants/${userId}`);
  return response.data.data;
};

export const getOrganizerProfile = async () => {
  const response = await apiClient.get<ApiResponse<User>>('/organizer/profile');
  return response.data.data;
};

export const updateOrganizerProfile = async (payload: UpdateProfileRequest) => {
  const response = await apiClient.put<ApiResponse<User>>(
    '/organizer/profile',
    payload
  );
  return response.data.data;
};

export const changeOrganizerPassword = async (payload: ChangePasswordRequest) => {
  const response = await apiClient.put<ApiResponse<{ password_changed: boolean }>>(
    '/organizer/profile/password',
    payload
  );
  return response.data.data;
};

export const getOrganizerClubs = async () => {
  const response = await apiClient.get<ApiResponse<ClubItem[]>>('/organizer/clubs');
  return response.data.data;
};

export const getOrganizerClubMembers = async (clubId: number) => {
  const response = await apiClient.get<ApiResponse<ClubMember[]>>(
    `/organizer/clubs/${clubId}/members`
  );
  return response.data.data;
};

export const saveOrganizerClubMember = async (
  clubId: number,
  payload: SaveClubMemberPayload
) => {
  const response = await apiClient.post<ApiResponse<{
    id: number;
    user_id: number;
    club_id: number;
    member_role: string;
    joined_at: string;
  }>>(`/organizer/clubs/${clubId}/members`, payload);
  return response.data.data;
};

export const removeOrganizerClubMember = async (clubId: number, userId: number) => {
  const response = await apiClient.delete<ApiResponse<{ id: number; club_id: number; user_id: number }>>(
    `/organizer/clubs/${clubId}/members/${userId}`
  );
  return response.data.data;
};
