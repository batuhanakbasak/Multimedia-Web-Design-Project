const express = require('express');

const organizerController = require('../controllers/organizer.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  positiveIdParam,
  eventFilterValidators,
  updateProfileValidator,
  changePasswordValidator,
  clubMemberValidator,
  eventCreateValidator,
  eventUpdateValidator,
  validateRequest,
} = require('../utils/validators');

const router = express.Router();

router.use(protect, authorizeRoles('organizer'));

router.get('/dashboard', organizerController.getDashboard);
router.get('/events', eventFilterValidators, validateRequest, organizerController.listEvents);
router.get('/events/:id', positiveIdParam('id'), validateRequest, organizerController.getEventById);
router.post('/events', eventCreateValidator, validateRequest, organizerController.createEvent);
router.put('/events/:id', eventUpdateValidator, validateRequest, organizerController.updateEvent);
router.delete('/events/:id', positiveIdParam('id'), validateRequest, organizerController.deleteEvent);
router.get('/events/:id/participants', positiveIdParam('id'), validateRequest, organizerController.getEventParticipants);
router.delete(
  '/events/:id/participants/:userId',
  [positiveIdParam('id'), positiveIdParam('userId')],
  validateRequest,
  organizerController.removeEventParticipant
);
router.get('/profile', organizerController.getProfile);
router.put('/profile', updateProfileValidator, validateRequest, organizerController.updateProfile);
router.put('/profile/password', changePasswordValidator, validateRequest, organizerController.changePassword);
router.get('/clubs', organizerController.getClubs);
router.get('/clubs/:id/members', positiveIdParam('id'), validateRequest, organizerController.getClubMembers);
router.post('/clubs/:id/members', clubMemberValidator, validateRequest, organizerController.saveClubMember);
router.delete(
  '/clubs/:id/members/:userId',
  [positiveIdParam('id'), positiveIdParam('userId')],
  validateRequest,
  organizerController.removeClubMember
);

module.exports = router;
