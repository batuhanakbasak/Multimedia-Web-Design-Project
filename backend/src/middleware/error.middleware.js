const AppError = require('../utils/errors');

const notFoundHandler = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || undefined;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with the same unique value already exists';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid parameter format';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
