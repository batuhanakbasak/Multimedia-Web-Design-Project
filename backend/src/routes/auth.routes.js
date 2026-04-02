const express = require('express');

const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  studentRegisterValidator,
  loginValidator,
  refreshTokenValidator,
  validateRequest,
} = require('../utils/validators');

const router = express.Router();

router.post('/register/student', studentRegisterValidator, validateRequest, authController.registerStudent);
router.post('/login/student', loginValidator, validateRequest, authController.loginStudent);
router.post('/login/organizer', loginValidator, validateRequest, authController.loginOrganizer);
router.post('/login/admin', loginValidator, validateRequest, authController.loginAdmin);
router.post('/refresh', refreshTokenValidator, validateRequest, authController.refresh);
router.post('/logout', refreshTokenValidator, validateRequest, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.me);

module.exports = router;
