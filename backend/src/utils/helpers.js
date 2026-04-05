const normalizeEmail = (email) => String(email).trim().toLowerCase();

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    profile_image: user.profile_image,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const getPagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};

const buildUpdateFields = (payload, allowedFields) => {
  const setClauses = [];
  const values = [];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      values.push(payload[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  });

  return {
    setClauses,
    values,
  };
};

const getRequestMeta = (req) => ({
  userAgent: req.get('user-agent') || null,
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
});

module.exports = {
  normalizeEmail,
  sanitizeUser,
  getPagination,
  buildUpdateFields,
  getRequestMeta,
};
