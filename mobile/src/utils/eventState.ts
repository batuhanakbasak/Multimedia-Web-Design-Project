import type { EventItem } from '../types/event';

export const getEventState = (event: Pick<EventItem, 'timeline_status' | 'status'>) =>
  event.timeline_status || event.status;

export const canJoinEvent = (
  event: Pick<EventItem, 'timeline_status' | 'status' | 'quota' | 'joined_count'>
) => {
  const state = getEventState(event);
  const isClosed = ['cancelled', 'completed', 'passed'].includes(state || '');
  const isFull =
    typeof event.joined_count === 'number' &&
    event.quota > 0 &&
    event.joined_count >= event.quota;

  return !isClosed && !isFull;
};

export const canLeaveEvent = (
  event: Pick<EventItem, 'timeline_status' | 'status'>
) => getEventState(event) === 'active';
