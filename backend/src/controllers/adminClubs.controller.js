const asyncHandler = require('../utils/async-handler');
const { successResponse } = require('../utils/response');
const adminClubsService = require('../services/adminClubs.service');

const listClubs = asyncHandler(async (req, res) => {
  const result = await adminClubsService.listClubs(req.query);

  return successResponse(res, {
    message: 'Clubs fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const getClubById = asyncHandler(async (req, res) => {
  const club = await adminClubsService.getClubDetail(Number.parseInt(req.params.id, 10));

  return successResponse(res, {
    message: 'Club detail fetched successfully',
    data: club,
  });
});

const createClub = asyncHandler(async (req, res) => {
  const club = await adminClubsService.createClub(req.body, req.user);

  return successResponse(res, {
    statusCode: 201,
    message: 'Club created successfully',
    data: club,
  });
});

const updateClub = asyncHandler(async (req, res) => {
  const club = await adminClubsService.updateClub(Number.parseInt(req.params.id, 10), req.body);

  return successResponse(res, {
    message: 'Club updated successfully',
    data: club,
  });
});

const deleteClub = asyncHandler(async (req, res) => {
  const club = await adminClubsService.deleteClub(Number.parseInt(req.params.id, 10));

  return successResponse(res, {
    message: 'Club deleted successfully',
    data: club,
  });
});

const getClubMembers = asyncHandler(async (req, res) => {
  const members = await adminClubsService.getClubMembers(Number.parseInt(req.params.id, 10));

  return successResponse(res, {
    message: 'Club members fetched successfully',
    data: members,
  });
});

const addClubMember = asyncHandler(async (req, res) => {
  const membership = await adminClubsService.saveClubMember(
    Number.parseInt(req.params.id, 10),
    req.body.user_id,
    req.body.member_role
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'Club member saved successfully',
    data: membership,
  });
});

const removeClubMember = asyncHandler(async (req, res) => {
  const membership = await adminClubsService.removeClubMember(
    Number.parseInt(req.params.id, 10),
    Number.parseInt(req.params.userId, 10)
  );

  return successResponse(res, {
    message: 'Club member removed successfully',
    data: membership,
  });
});

module.exports = {
  listClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  getClubMembers,
  addClubMember,
  removeClubMember,
};
