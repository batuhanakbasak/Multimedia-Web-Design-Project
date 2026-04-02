const express = require('express');

const organizerController = require('../controllers/organizer.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  positiveIdParam,
  eventFilterValidators,
  updateProfileValidator,
  eventCreateValidator,
  eventUpdateValidator,
  validateRequest,
} = require('../utils/validators');

const router = express.Router();

router.use(protect, authorizeRoles('organizer'));

router.get('/dashboard', organizerController.getDashboard);
router.get('/events', eventFilterValidators, validateRequest, organizerController.listEvents);
router.post('/events', eventCreateValidator, validateRequest, organizerController.createEvent);
router.put('/events/:id', eventUpdateValidator, validateRequest, organizerController.updateEvent);
router.delete('/events/:id', positiveIdParam('id'), validateRequest, organizerController.deleteEvent);
router.get('/events/:id/participants', positiveIdParam('id'), validateRequest, organizerController.getEventParticipants);
router.get('/profile', organizerController.getProfile);
router.put('/profile', updateProfileValidator, validateRequest, organizerController.updateProfile);
router.get('/clubs', organizerController.getClubs);

module.exports = router;
