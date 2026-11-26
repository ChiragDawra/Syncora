const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// ?page=2&limit=20 -> { page: 2, limit: 20, skip: 20 }. limit is capped at 100, page is at least 1.
function parsePagination(query = {}, defaultLimit = DEFAULT_LIMIT) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function buildMeta({ page, limit }, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNext: page < totalPages };
}

module.exports = { parsePagination, buildMeta, MAX_LIMIT };
