import type { ApiResponse } from '../types/api';
import type { ClubDetail, ClubItem, ClubMember } from '../types/club';
import type { EventItem, EventListFilters } from '../types/event';

import { publicApiClient } from './api';

export const getPublicClubs = async () => {
  const response = await publicApiClient.get<ApiResponse<ClubItem[]>>('/clubs');
  return response.data.data;
};

export const getPublicClubDetail = async (clubId: number) => {
  const response = await publicApiClient.get<ApiResponse<ClubDetail>>(
    `/clubs/${clubId}`
  );
  return response.data.data;
};

export const getPublicClubMembers = async (clubId: number) => {
  const response = await publicApiClient.get<ApiResponse<ClubMember[]>>(
    `/clubs/${clubId}/members`
  );
  return response.data.data;
};

export const getPublicClubEvents = async (
  clubId: number,
  params: EventListFilters = {}
) => {
  const response = await publicApiClient.get<ApiResponse<EventItem[]>>(
    `/clubs/${clubId}/events`,
    {
      params,
    }
  );

  return {
    items: response.data.data,
    meta: response.data.meta,
  };
};
