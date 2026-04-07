const express = require('express');

const studentController = require('../controllers/student.controller');
const participantsController = require('../controllers/participants.controller');
const favoritesController = require('../controllers/favorites.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  positiveIdParam,
  eventFilterValidators,
  updateProfileValidator,
  changePasswordValidator,
  validateRequest,
} = require('../utils/validators');

const router = express.Router();

router.use(protect, authorizeRoles('student'));

router.get('/dashboard', studentController.getDashboard);
router.get('/events', eventFilterValidators, validateRequest, studentController.listEvents);
router.get('/events/search', eventFilterValidators, validateRequest, studentController.searchEvents);
router.get('/events/:id', positiveIdParam('id'), validateRequest, studentController.getEventById);
router.post('/events/:id/join', positiveIdParam('id'), validateRequest, participantsController.joinEvent);
router.delete('/events/:id/leave', positiveIdParam('id'), validateRequest, participantsController.leaveEvent);
router.get('/my-events', participantsController.listJoinedEvents);
router.get('/favorites', favoritesController.listFavorites);
router.post('/favorites/:eventId', positiveIdParam('eventId'), validateRequest, favoritesController.addFavorite);
router.delete('/favorites/:eventId', positiveIdParam('eventId'), validateRequest, favoritesController.removeFavorite);
router.get('/profile', studentController.getProfile);
router.put('/profile', updateProfileValidator, validateRequest, studentController.updateProfile);
router.put('/profile/password', changePasswordValidator, validateRequest, studentController.changePassword);
router.get('/clubs', studentController.listClubs);
router.get('/clubs/:id', positiveIdParam('id'), validateRequest, studentController.getClubById);

module.exports = router;
