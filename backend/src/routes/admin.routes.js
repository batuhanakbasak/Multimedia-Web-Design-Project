const express = require('express');

const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  positiveIdParam,
  paginationValidators,
  eventFilterValidators,
  roleUpdateValidator,
  statusUpdateValidator,
  clubCreateValidator,
  clubUpdateValidator,
  clubMemberValidator,
  validateRequest,
} = require('../utils/validators');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', paginationValidators, validateRequest, adminController.listUsers);
router.get('/users/:id', positiveIdParam('id'), validateRequest, adminController.getUserById);
router.put('/users/:id/role', roleUpdateValidator, validateRequest, adminController.updateUserRole);
router.put('/users/:id/status', statusUpdateValidator, validateRequest, adminController.updateUserStatus);
router.get('/clubs', paginationValidators, validateRequest, adminController.listClubs);
router.post('/clubs', clubCreateValidator, validateRequest, adminController.createClub);
router.put('/clubs/:id', clubUpdateValidator, validateRequest, adminController.updateClub);
router.delete('/clubs/:id', positiveIdParam('id'), validateRequest, adminController.deleteClub);
router.get('/clubs/:id/members', positiveIdParam('id'), validateRequest, adminController.getClubMembers);
router.post('/clubs/:id/members', clubMemberValidator, validateRequest, adminController.addClubMember);
router.delete(
  '/clubs/:id/members/:userId',
  [positiveIdParam('id'), positiveIdParam('userId')],
  validateRequest,
  adminController.removeClubMember
);
router.get('/events', eventFilterValidators, validateRequest, adminController.listEvents);
router.get('/events/:id', positiveIdParam('id'), validateRequest, adminController.getEventById);
router.delete('/events/:id', positiveIdParam('id'), validateRequest, adminController.deleteEvent);

module.exports = router;
