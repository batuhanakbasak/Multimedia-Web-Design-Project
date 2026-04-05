const { query } = require('../config/db');
const AppError = require('../utils/errors');
const { getEventDetail, getPaginatedEvents } = require('../utils/event-query');

const getEventDetailOrFail = async (eventId) => {
  const event = await getEventDetail(query, eventId, null);

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  return event;
};

const listEvents = async (filters = {}) => getPaginatedEvents(query, filters, {});

const getEventDetailById = async (eventId) => getEventDetailOrFail(eventId);

const updateEventStatus = async (eventId, status) => {
  await getEventDetailOrFail(eventId);

  await query(
    `
      UPDATE events
      SET status = $1
      WHERE id = $2
    `,
    [status, eventId]
  );

  return getEventDetailOrFail(eventId);
};

const deleteEvent = async (eventId) => {
  const result = await query(
    `
      DELETE FROM events
      WHERE id = $1
      RETURNING id, title
    `,
    [eventId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Event not found');
  }

  return result.rows[0];
};

module.exports = {
  listEvents,
  getEventDetailById,
  updateEventStatus,
  deleteEvent,
};
