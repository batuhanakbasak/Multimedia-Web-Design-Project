const express = require('express');

const participantsController = require('../controllers/participants.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { positiveIdParam, validateRequest } = require('../utils/validators');

const router = express.Router();

router.use(protect, authorizeRoles('student'));

router.get('/joined', participantsController.listJoinedEvents);
router.post('/events/:eventId/join', positiveIdParam('eventId'), validateRequest, participantsController.joinEvent);
router.delete('/events/:eventId/leave', positiveIdParam('eventId'), validateRequest, participantsController.leaveEvent);

module.exports = router;
