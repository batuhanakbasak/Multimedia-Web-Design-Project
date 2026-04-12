import type { EventItem } from './event';

export interface DashboardEventPreview {
  id: number;
  title: string;
  category: string;
  event_date: string;
  location: string;
  status: string;
}

export interface StudentDashboard {
  joined_events_count: number;
  favorite_count: number;
  upcoming_joined_events: DashboardEventPreview[];
  recommended_events: DashboardEventPreview[];
}

export interface OrganizerDashboard {
  total_events: number;
  active_events: number;
  completed_events: number;
  cancelled_events: number;
  total_participants: number;
  upcoming_events: EventItem[];
  events: EventItem[];
}
