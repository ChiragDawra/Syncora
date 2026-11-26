// One success envelope for every endpoint: { success: true, data, meta? }
function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

module.exports = { ok, created };
