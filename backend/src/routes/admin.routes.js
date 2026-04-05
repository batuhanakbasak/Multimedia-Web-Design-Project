const express = require('express');

const adminAuthController = require('../controllers/adminAuth.controller');
const adminDashboardController = require('../controllers/adminDashboard.controller');
const adminUsersController = require('../controllers/adminUsers.controller');
const adminClubsController = require('../controllers/adminClubs.controller');
const adminEventsController = require('../controllers/adminEvents.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  adminLoginValidator,
  adminUserFiltersValidator,
  adminClubFiltersValidator,
  clubCreateValidator,
  clubMemberValidator,
  clubUpdateValidator,
  eventFilterValidators,
  eventStatusUpdateValidator,
  positiveIdParam,
  roleUpdateValidator,
  statusUpdateValidator,
  validateRequest,
} = require('../utils/validators');

const router = express.Router();

router.post('/auth/login', adminLoginValidator, validateRequest, adminAuthController.login);
router.get('/auth/me', protect, authorizeRoles('admin'), adminAuthController.me);
router.post('/auth/logout', protect, authorizeRoles('admin'), adminAuthController.logout);

router.use(protect, authorizeRoles('admin'));

router.get('/dashboard', adminDashboardController.getDashboard);

router.get('/users', adminUserFiltersValidator, validateRequest, adminUsersController.listUsers);
router.get('/users/:id', positiveIdParam('id'), validateRequest, adminUsersController.getUserById);
router.put('/users/:id/role', roleUpdateValidator, validateRequest, adminUsersController.updateUserRole);
router.put('/users/:id/status', statusUpdateValidator, validateRequest, adminUsersController.updateUserStatus);

router.get('/clubs', adminClubFiltersValidator, validateRequest, adminClubsController.listClubs);
router.get('/clubs/:id', positiveIdParam('id'), validateRequest, adminClubsController.getClubById);
router.post('/clubs', clubCreateValidator, validateRequest, adminClubsController.createClub);
router.put('/clubs/:id', clubUpdateValidator, validateRequest, adminClubsController.updateClub);
router.delete('/clubs/:id', positiveIdParam('id'), validateRequest, adminClubsController.deleteClub);
router.get('/clubs/:id/members', positiveIdParam('id'), validateRequest, adminClubsController.getClubMembers);
router.post('/clubs/:id/members', clubMemberValidator, validateRequest, adminClubsController.addClubMember);
router.delete(
  '/clubs/:id/members/:userId',
  [positiveIdParam('id'), positiveIdParam('userId')],
  validateRequest,
  adminClubsController.removeClubMember
);

router.get('/events', eventFilterValidators, validateRequest, adminEventsController.listEvents);
router.get('/events/:id', positiveIdParam('id'), validateRequest, adminEventsController.getEventById);
router.put('/events/:id/status', eventStatusUpdateValidator, validateRequest, adminEventsController.updateEventStatus);
router.delete('/events/:id', positiveIdParam('id'), validateRequest, adminEventsController.deleteEvent);

module.exports = router;
