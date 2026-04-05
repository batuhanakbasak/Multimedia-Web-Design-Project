const executeQuery = (db, text, params = []) => {
  if (typeof db === 'function') {
    return db(text, params);
  }

  return db.query(text, params);
};

const capabilityCache = new Map();

const hasColumn = async (db, tableName, columnName) => {
  const cacheKey = `${tableName}.${columnName}`;

  if (!capabilityCache.has(cacheKey)) {
    const promise = executeQuery(
      db,
      `
        SELECT EXISTS (
          SELECT 1
          FROM pg_attribute
          WHERE attrelid = to_regclass($1)
            AND attname = $2
            AND NOT attisdropped
        ) AS column_exists
      `,
      [tableName, columnName]
    )
      .then((result) => Boolean(result.rows[0]?.column_exists))
      .catch((error) => {
        capabilityCache.delete(cacheKey);
        throw error;
      });

    capabilityCache.set(cacheKey, promise);
  }

  return capabilityCache.get(cacheKey);
};

const hasEventsMetadataColumn = async (db) => hasColumn(db, 'events', 'metadata');

const isMissingColumnError = (error, columnName) =>
  error?.code === '42703' &&
  String(error.message || '')
    .toLowerCase()
    .includes(String(columnName || '').toLowerCase());

module.exports = {
  hasColumn,
  hasEventsMetadataColumn,
  isMissingColumnError,
};
