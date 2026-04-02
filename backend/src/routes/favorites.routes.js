const express = require('express');

const favoritesController = require('../controllers/favorites.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { positiveIdParam, validateRequest } = require('../utils/validators');

const router = express.Router();

router.use(protect, authorizeRoles('student'));

router.get('/', favoritesController.listFavorites);
router.post('/:eventId', positiveIdParam('eventId'), validateRequest, favoritesController.addFavorite);
router.delete('/:eventId', positiveIdParam('eventId'), validateRequest, favoritesController.removeFavorite);

module.exports = router;
