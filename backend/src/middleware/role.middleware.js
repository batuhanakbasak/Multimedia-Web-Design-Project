const AppError = require('../utils/errors');

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication is required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError(403, 'You do not have permission to access this resource'));
  }

  return next();
};

module.exports = {
  authorizeRoles,
};
