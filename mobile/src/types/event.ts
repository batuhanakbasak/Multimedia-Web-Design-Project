export type TimelineStatus = 'active' | 'passed' | 'cancelled' | 'completed';

export interface EventClub {
  id: number;
  name: string;
  logo_url?: string | null;
  description?: string;
  is_active?: boolean;
}

export interface EventOrganizer {
  id: number;
  full_name: string;
  email?: string;
  profile_image?: string | null;
}

export interface EventItem {
  id: number;
  club_id: number | null;
  organizer_id: number;
  title: string;
  description: string;
  category: string;
  event_date: string;
  location: string;
  image_url: string | null;
  quota: number;
  status: string;
  metadata?: {
    map_link?: string;
    [key: string]: unknown;
  } | null;
  created_at?: string;
  updated_at?: string;
  joined_count?: number;
  is_favorite?: boolean;
  is_joined?: boolean;
  timeline_status?: TimelineStatus;
  organizer?: EventOrganizer;
  club?: EventClub | null;
}

export interface EventParticipant {
  id: number;
  full_name: string;
  email: string;
  profile_image: string | null;
  status: string;
  joined_at: string;
}

export interface EventListFilters {
  search?: string;
  keyword?: string;
  category?: string;
  date?: string;
  status?: string;
  sort?: 'newest' | 'oldest' | 'upcoming';
  organizer_id?: number | string;
  club_id?: number | string;
  page?: number;
  limit?: number;
}

export interface JoinEventResponse {
  id: number;
  title: string;
  joined_count: number;
  is_joined: boolean;
  is_favorite: boolean;
}

export interface OrganizerEventPayload {
  club_id?: number | null;
  title: string;
  description: string;
  category: string;
  event_date: string;
  location: string;
  image_url?: string | null;
  quota: number;
  status?: string;
  metadata?: {
    map_link?: string;
  };
}
