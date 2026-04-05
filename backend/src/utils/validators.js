const { body, param, query, validationResult } = require('express-validator');

const roles = ['student', 'organizer', 'admin'];
const memberRoles = ['member', 'manager'];
const eventStatuses = ['active', 'cancelled', 'completed'];
const allowedSorts = ['newest', 'oldest', 'upcoming'];

const isNullableUrl = (value) => {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  return /^https?:\/\/.+/i.test(value);
};

const isNullableObject = (value) => {
  if (value === undefined || value === null) {
    return true;
  }

  return typeof value === 'object' && !Array.isArray(value);
};

const positiveIdParam = (fieldName = 'id') =>
  param(fieldName)
    .isInt({ min: 1 })
    .withMessage(`${fieldName} must be a positive integer`)
    .toInt();

const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be at least 1').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
];

const eventFilterValidators = [
  ...paginationValidators,
  query('search').optional().trim().isLength({ min: 1, max: 150 }),
  query('keyword').optional().trim().isLength({ min: 1, max: 150 }),
  query('category').optional().trim().isLength({ min: 1, max: 50 }),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  query('status').optional().isIn(eventStatuses).withMessage('status is invalid'),
  query('sort').optional().isIn(allowedSorts).withMessage('sort value is invalid'),
  query('organizer_id').optional().isInt({ min: 1 }).withMessage('organizer_id must be a positive integer').toInt(),
  query('club_id').optional().isInt({ min: 1 }).withMessage('club_id must be a positive integer').toInt(),
];

const studentRegisterValidator = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Email is invalid').normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Email is invalid').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const adminLoginValidator = loginValidator;

const refreshTokenValidator = [
  body('refresh_token').isString().notEmpty().withMessage('refresh_token is required'),
];

const updateProfileValidator = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('full_name must be between 2 and 100 characters'),
  body('profile_image')
    .optional({ nullable: true })
    .custom(isNullableUrl)
    .withMessage('profile_image must be a valid URL or null'),
  body().custom((value) => {
    const hasAtLeastOneField =
      Object.prototype.hasOwnProperty.call(value, 'full_name') ||
      Object.prototype.hasOwnProperty.call(value, 'profile_image');

    if (!hasAtLeastOneField) {
      throw new Error('At least one profile field must be provided');
    }

    return true;
  }),
];

const eventCreateValidator = [
  body('club_id')
    .optional({ nullable: true })
    .custom((value) => value === null || Number.isInteger(Number(value)) && Number(value) > 0)
    .withMessage('club_id must be null or a positive integer')
    .customSanitizer((value) => (value === null ? null : Number.parseInt(value, 10))),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('title is required')
    .isLength({ min: 3, max: 150 })
    .withMessage('title must be between 3 and 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('description is required')
    .isLength({ min: 10 })
    .withMessage('description must be at least 10 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('category is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('category must be between 2 and 50 characters'),
  body('event_date').isISO8601().withMessage('event_date must be a valid ISO datetime').toDate(),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('location is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('location must be between 2 and 150 characters'),
  body('image_url')
    .optional({ nullable: true })
    .custom(isNullableUrl)
    .withMessage('image_url must be a valid URL or null'),
  body('quota')
    .isInt({ min: 0 })
    .withMessage('quota must be a non-negative integer')
    .toInt(),
  body('metadata')
    .optional({ nullable: true })
    .custom(isNullableObject)
    .withMessage('metadata must be an object'),
];

const eventUpdateValidator = [
  positiveIdParam('id'),
  body('club_id')
    .optional({ nullable: true })
    .custom((value) => value === null || Number.isInteger(Number(value)) && Number(value) > 0)
    .withMessage('club_id must be null or a positive integer')
    .customSanitizer((value) => (value === null ? null : Number.parseInt(value, 10))),
  body('title').optional().trim().isLength({ min: 3, max: 150 }).withMessage('title must be between 3 and 150 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('description must be at least 10 characters'),
  body('category').optional().trim().isLength({ min: 2, max: 50 }).withMessage('category must be between 2 and 50 characters'),
  body('event_date').optional().isISO8601().withMessage('event_date must be a valid ISO datetime').toDate(),
  body('location').optional().trim().isLength({ min: 2, max: 150 }).withMessage('location must be between 2 and 150 characters'),
  body('image_url')
    .optional({ nullable: true })
    .custom(isNullableUrl)
    .withMessage('image_url must be a valid URL or null'),
  body('quota')
    .optional()
    .isInt({ min: 0 })
    .withMessage('quota must be a non-negative integer')
    .toInt(),
  body('status').optional().isIn(eventStatuses).withMessage('status is invalid'),
  body('metadata')
    .optional({ nullable: true })
    .custom(isNullableObject)
    .withMessage('metadata must be an object'),
];

const clubCreateValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('name must be between 2 and 100 characters'),
  body('description').optional().trim(),
  body('logo_url')
    .optional({ nullable: true })
    .custom(isNullableUrl)
    .withMessage('logo_url must be a valid URL or null'),
  body('created_by').optional().isInt({ min: 1 }).withMessage('created_by must be a positive integer').toInt(),
];

const clubUpdateValidator = [
  positiveIdParam('id'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('name must be between 2 and 100 characters'),
  body('description').optional().trim(),
  body('logo_url')
    .optional({ nullable: true })
    .custom(isNullableUrl)
    .withMessage('logo_url must be a valid URL or null'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean').toBoolean(),
];

const clubMemberValidator = [
  positiveIdParam('id'),
  body('user_id').isInt({ min: 1 }).withMessage('user_id must be a positive integer').toInt(),
  body('member_role').isIn(memberRoles).withMessage('member_role is invalid'),
];

const roleUpdateValidator = [
  positiveIdParam('id'),
  body('role').isIn(roles).withMessage('role is invalid'),
];

const statusUpdateValidator = [
  positiveIdParam('id'),
  body('is_active').isBoolean().withMessage('is_active must be boolean').toBoolean(),
];

const adminUserFiltersValidator = [
  ...paginationValidators,
  query('search').optional().trim().isLength({ min: 1, max: 150 }),
  query('role').optional().isIn(roles).withMessage('role is invalid'),
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false')
    .toBoolean(),
];

const adminClubFiltersValidator = [
  ...paginationValidators,
  query('search').optional().trim().isLength({ min: 1, max: 150 }),
];

const eventStatusUpdateValidator = [
  positiveIdParam('id'),
  body('status').isIn(eventStatuses).withMessage('status is invalid'),
];

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
};

module.exports = {
  positiveIdParam,
  paginationValidators,
  eventFilterValidators,
  studentRegisterValidator,
  loginValidator,
  adminLoginValidator,
  refreshTokenValidator,
  updateProfileValidator,
  eventCreateValidator,
  eventUpdateValidator,
  clubCreateValidator,
  clubUpdateValidator,
  clubMemberValidator,
  roleUpdateValidator,
  statusUpdateValidator,
  adminUserFiltersValidator,
  adminClubFiltersValidator,
  eventStatusUpdateValidator,
  validateRequest,
};
