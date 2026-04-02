const express = require('express');

const eventsController = require('../controllers/events.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { positiveIdParam, eventFilterValidators, validateRequest } = require('../utils/validators');

const router = express.Router();

router.get('/', eventFilterValidators, validateRequest, eventsController.listEvents);
router.get('/search', eventFilterValidators, validateRequest, eventsController.searchEvents);
router.get('/:id', optionalAuth, positiveIdParam('id'), validateRequest, eventsController.getEventById);

module.exports = router;
