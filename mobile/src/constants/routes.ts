import type { NavigatorScreenParams } from '@react-navigation/native';

export const AUTH_ROUTES = {
  Splash: 'Splash',
  RoleSelection: 'RoleSelection',
  StudentLogin: 'StudentLogin',
  StudentRegister: 'StudentRegister',
  OrganizerLogin: 'OrganizerLogin',
} as const;

export const STUDENT_TAB_ROUTES = {
  Home: 'StudentHomeTab',
  Explore: 'StudentExploreTab',
  MyEvents: 'StudentMyEventsTab',
  Favorites: 'StudentFavoritesTab',
  Profile: 'StudentProfileTab',
} as const;

export const STUDENT_STACK_ROUTES = {
  Tabs: 'StudentTabs',
  Clubs: 'StudentClubs',
  EventDetail: 'StudentEventDetail',
  ClubDetail: 'StudentClubDetail',
  EditProfile: 'StudentEditProfile',
  ChangePassword: 'StudentChangePassword',
} as const;

export const ORGANIZER_TAB_ROUTES = {
  Dashboard: 'OrganizerDashboardTab',
  Events: 'OrganizerEventsTab',
  CreateEvent: 'OrganizerCreateEventTab',
  Clubs: 'OrganizerClubsTab',
  Profile: 'OrganizerProfileTab',
} as const;

export const ORGANIZER_STACK_ROUTES = {
  Tabs: 'OrganizerTabs',
  EventDetail: 'OrganizerEventDetail',
  EditEvent: 'OrganizerEditEvent',
  Participants: 'OrganizerParticipants',
  ClubMembers: 'OrganizerClubMembers',
  AddMember: 'OrganizerAddMember',
  EditProfile: 'OrganizerEditProfile',
  ChangePassword: 'OrganizerChangePassword',
} as const;

export type AuthStackParamList = {
  Splash: undefined;
  RoleSelection: undefined;
  StudentLogin: { prefilledEmail?: string; successMessage?: string } | undefined;
  StudentRegister: undefined;
  OrganizerLogin: undefined;
};

export type StudentTabParamList = {
  StudentHomeTab: undefined;
  StudentExploreTab: undefined;
  StudentMyEventsTab: undefined;
  StudentFavoritesTab: undefined;
  StudentProfileTab: undefined;
};

export type StudentStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList> | undefined;
  StudentClubs: undefined;
  StudentEventDetail: { eventId: number };
  StudentClubDetail: { clubId: number };
  StudentEditProfile: undefined;
  StudentChangePassword: undefined;
};

export type OrganizerTabParamList = {
  OrganizerDashboardTab: undefined;
  OrganizerEventsTab: undefined;
  OrganizerCreateEventTab: undefined;
  OrganizerClubsTab: undefined;
  OrganizerProfileTab: undefined;
};

export type OrganizerStackParamList = {
  OrganizerTabs: NavigatorScreenParams<OrganizerTabParamList> | undefined;
  OrganizerEventDetail: { eventId: number };
  OrganizerEditEvent: { eventId: number };
  OrganizerParticipants: { eventId: number; eventTitle?: string };
  OrganizerClubMembers: { clubId: number; clubName?: string };
  OrganizerAddMember: { clubId: number; clubName?: string };
  OrganizerEditProfile: undefined;
  OrganizerChangePassword: undefined;
};
