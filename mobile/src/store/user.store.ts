import { create } from 'zustand';

import type { EventItem } from '../types/event';
import type { User } from '../types/user';

interface UserStoreState {
  favoriteEventIds: number[];
  joinedEventIds: number[];
  cachedProfile: User | null;
  hydrateFromEvents: (events: EventItem[]) => void;
  setFavoriteStatus: (eventId: number, isFavorite: boolean) => void;
  setJoinedStatus: (eventId: number, isJoined: boolean) => void;
  setProfile: (user: User | null) => void;
  reset: () => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  favoriteEventIds: [],
  joinedEventIds: [],
  cachedProfile: null,
  hydrateFromEvents: (events) =>
    set((state) => {
      const favoriteSet = new Set(state.favoriteEventIds);
      const joinedSet = new Set(state.joinedEventIds);

      events.forEach((event) => {
        if (event.is_favorite) {
          favoriteSet.add(event.id);
        }

        if (event.is_joined) {
          joinedSet.add(event.id);
        }
      });

      return {
        favoriteEventIds: [...favoriteSet],
        joinedEventIds: [...joinedSet],
      };
    }),
  setFavoriteStatus: (eventId, isFavorite) =>
    set((state) => {
      const nextIds = new Set(state.favoriteEventIds);

      if (isFavorite) {
        nextIds.add(eventId);
      } else {
        nextIds.delete(eventId);
      }

      return {
        favoriteEventIds: [...nextIds],
      };
    }),
  setJoinedStatus: (eventId, isJoined) =>
    set((state) => {
      const nextIds = new Set(state.joinedEventIds);

      if (isJoined) {
        nextIds.add(eventId);
      } else {
        nextIds.delete(eventId);
      }

      return {
        joinedEventIds: [...nextIds],
      };
    }),
  setProfile: (user) => set({ cachedProfile: user }),
  reset: () =>
    set({
      favoriteEventIds: [],
      joinedEventIds: [],
      cachedProfile: null,
    }),
}));
