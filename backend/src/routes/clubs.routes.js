const express = require('express');

const clubsController = require('../controllers/clubs.controller');
const { positiveIdParam, eventFilterValidators, validateRequest } = require('../utils/validators');

const router = express.Router();

router.get('/', clubsController.listClubs);
router.get('/:id/members', positiveIdParam('id'), validateRequest, clubsController.getClubMembers);
router.get('/:id/events', positiveIdParam('id'), eventFilterValidators, validateRequest, clubsController.getClubEvents);
router.get('/:id', positiveIdParam('id'), validateRequest, clubsController.getClubById);

module.exports = router;
