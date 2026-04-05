const asyncHandler = require('../utils/async-handler');
const { successResponse } = require('../utils/response');
const adminEventsService = require('../services/adminEvents.service');

const listEvents = asyncHandler(async (req, res) => {
  const result = await adminEventsService.listEvents(req.query);

  return successResponse(res, {
    message: 'Events fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await adminEventsService.getEventDetailById(Number.parseInt(req.params.id, 10));

  return successResponse(res, {
    message: 'Event detail fetched successfully',
    data: event,
  });
});

const updateEventStatus = asyncHandler(async (req, res) => {
  const event = await adminEventsService.updateEventStatus(
    Number.parseInt(req.params.id, 10),
    req.body.status
  );

  return successResponse(res, {
    message: 'Event status updated successfully',
    data: event,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await adminEventsService.deleteEvent(Number.parseInt(req.params.id, 10));

  return successResponse(res, {
    message: 'Event deleted successfully',
    data: event,
  });
});

module.exports = {
  listEvents,
  getEventById,
  updateEventStatus,
  deleteEvent,
};
