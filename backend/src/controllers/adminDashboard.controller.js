const asyncHandler = require('../utils/async-handler');
const { successResponse } = require('../utils/response');
const adminDashboardService = require('../services/adminDashboard.service');

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await adminDashboardService.getDashboardSummary();

  return successResponse(res, {
    message: 'Admin dashboard fetched successfully',
    data: dashboard,
  });
});

module.exports = {
  getDashboard,
};
