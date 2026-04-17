import type { EventItem } from './event';

export interface ClubCreator {
  id: number;
  full_name: string;
  email?: string;
  profile_image?: string | null;
}

export interface ClubItem {
  id: number;
  name: string;
  description?: string;
  logo_url?: string | null;
  is_active?: boolean;
  member_role?: string;
  joined_at?: string;
  member_count?: number;
  event_count?: number;
  created_by?: ClubCreator;
}

export interface ClubMember {
  id: number;
  full_name: string;
  email: string;
  role: string;
  profile_image: string | null;
  is_active: boolean;
  member_role: string;
  joined_at: string;
}

export interface ClubDetail extends ClubItem {
  managers: ClubMember[];
  upcoming_events: EventItem[];
}

export interface SaveClubMemberPayload {
  user_id: number;
  member_role: 'member' | 'manager';
}
