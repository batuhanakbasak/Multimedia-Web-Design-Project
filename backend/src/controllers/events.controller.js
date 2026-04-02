const { query } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { getPaginatedEvents, getEventDetail } = require('../utils/event-query');

const listEvents = asyncHandler(async (req, res) => {
  const result = await getPaginatedEvents(query, req.query, {
    defaultStatus: 'active',
    upcomingOnly: !req.query.status,
  });

  return successResponse(res, {
    message: 'Events fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const searchEvents = asyncHandler(async (req, res) => {
  const result = await getPaginatedEvents(query, req.query, {
    defaultStatus: 'active',
    upcomingOnly: !req.query.status,
  });

  return successResponse(res, {
    message: 'Event search results fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const event = await getEventDetail(query, Number.parseInt(req.params.id, 10), userId);

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  return successResponse(res, {
    message: 'Event detail fetched successfully',
    data: event,
  });
});

module.exports = {
  listEvents,
  searchEvents,
  getEventById,
};
