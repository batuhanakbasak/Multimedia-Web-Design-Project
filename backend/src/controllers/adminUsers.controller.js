const asyncHandler = require('../utils/async-handler');
const { successResponse } = require('../utils/response');
const adminUsersService = require('../services/adminUsers.service');

const listUsers = asyncHandler(async (req, res) => {
  const result = await adminUsersService.listUsers(req.query);

  return successResponse(res, {
    message: 'Users fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await adminUsersService.getUserDetail(Number.parseInt(req.params.id, 10));

  return successResponse(res, {
    message: 'User detail fetched successfully',
    data: user,
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminUsersService.updateUserRole(
    Number.parseInt(req.params.id, 10),
    req.body.role,
    req.user
  );

  return successResponse(res, {
    message: 'User role updated successfully',
    data: user,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await adminUsersService.updateUserStatus(
    Number.parseInt(req.params.id, 10),
    req.body.is_active,
    req.user
  );

  return successResponse(res, {
    message: 'User status updated successfully',
    data: user,
  });
});

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
};
