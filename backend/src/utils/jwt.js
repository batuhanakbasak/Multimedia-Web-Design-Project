const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ms = require('ms');

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET;

const buildAccessPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: user.role,
  token_type: 'access',
});

const buildRefreshPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: user.role,
  token_type: 'refresh',
});

const signAccessToken = (user) =>
  jwt.sign(buildAccessPayload(user), getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const signRefreshToken = (user) =>
  jwt.sign(buildRefreshPayload(user), getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, getAccessSecret());

  if (payload.token_type !== 'access') {
    throw new Error('Invalid access token type.');
  }

  return payload;
};

const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, getRefreshSecret());

  if (payload.token_type !== 'refresh') {
    throw new Error('Invalid refresh token type.');
  }

  return payload;
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const getRefreshTokenExpiryDate = () => {
  const ttl = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return new Date(Date.now() + ms(ttl));
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
};
