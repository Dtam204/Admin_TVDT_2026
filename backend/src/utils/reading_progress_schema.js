const SCHEMA_CACHE_TTL_MS = 15000;

let schemaCache = {
  expiresAt: 0,
  data: null,
};

async function getReadingProgressSchema(pool) {
  const now = Date.now();
  if (schemaCache.data && now < schemaCache.expiresAt) {
    return schemaCache.data;
  }

  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'user_reading_progress'`
  );

  const columnSet = new Set(rows.map((r) => r.column_name));
  const has = (name) => columnSet.has(name);

  const schema = {
    hasTable: rows.length > 0,
    pageColumn: has('last_page') ? 'last_page' : has('current_page') ? 'current_page' : null,
    percentColumn: has('progress_percent') ? 'progress_percent' : null,
    finishedColumn: has('is_finished') ? 'is_finished' : null,
    totalPagesColumn: has('total_pages') ? 'total_pages' : null,
    lastReadAtColumn: has('last_read_at') ? 'last_read_at' : null,
    updatedAtColumn: has('updated_at') ? 'updated_at' : null,
  };

  schemaCache = {
    data: schema,
    expiresAt: now + SCHEMA_CACHE_TTL_MS,
  };

  return schema;
}

function buildReadingProgressSelectClause(schema) {
  const pageExpr = schema.pageColumn ? `${schema.pageColumn} AS last_page` : '1 AS last_page';

  let percentExpr = '0::numeric AS progress_percent';
  if (schema.percentColumn) {
    percentExpr = `${schema.percentColumn}::numeric AS progress_percent`;
  } else if (schema.totalPagesColumn && schema.pageColumn) {
    percentExpr = `
      CASE
        WHEN COALESCE(${schema.totalPagesColumn}, 0) > 0
          THEN LEAST(100, GREATEST(0, ROUND(((${schema.pageColumn}::numeric / NULLIF(${schema.totalPagesColumn}, 0)::numeric) * 100), 2)))
        ELSE 0
      END AS progress_percent
    `;
  }

  const finishedExpr = schema.finishedColumn
    ? `${schema.finishedColumn} AS is_finished`
    : 'FALSE AS is_finished';

  const lastReadExpr = schema.lastReadAtColumn
    ? `${schema.lastReadAtColumn} AS last_read_at`
    : 'NULL::timestamp AS last_read_at';

  const updatedExpr = schema.updatedAtColumn
    ? `${schema.updatedAtColumn} AS updated_at`
    : 'NULL::timestamp AS updated_at';

  return [
    'user_id',
    'book_id',
    pageExpr,
    percentExpr,
    finishedExpr,
    lastReadExpr,
    updatedExpr,
  ].join(', ');
}

function normalizeReadingProgressRow(row, fallback = {}) {
  const lastPage = Math.max(Number(row?.last_page ?? fallback.last_page ?? 1) || 1, 1);
  const progressPercent = Math.min(
    Math.max(Number(row?.progress_percent ?? fallback.progress_percent ?? 0) || 0, 0),
    100
  );
  const isFinished = Boolean(row?.is_finished ?? fallback.is_finished ?? false) || progressPercent >= 100;

  return {
    user_id: Number(row?.user_id ?? fallback.user_id ?? 0) || 0,
    book_id: Number(row?.book_id ?? fallback.book_id ?? 0) || 0,
    last_page: lastPage,
    progress_percent: progressPercent,
    is_finished: isFinished,
    last_read_at: row?.last_read_at ?? fallback.last_read_at ?? null,
    updated_at: row?.updated_at ?? fallback.updated_at ?? null,
  };
}

module.exports = {
  getReadingProgressSchema,
  buildReadingProgressSelectClause,
  normalizeReadingProgressRow,
};
