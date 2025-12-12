const db = require('../db');

// Returns a model name for a given request/user.
// Priority: ENV AI_MODEL -> feature_flags table -> default
async function getModelForRequest(userId) {
  // Fast override from env for emergency rollback/quick testing
  if (process.env.AI_MODEL) return process.env.AI_MODEL;

  try {
    const res = await db.query('SELECT value FROM feature_flags WHERE key = $1', ['ai:model']);
    if (res.rowCount === 0) return 'claude-4-mini';
    const value = res.rows[0].value;

    // If percent field present, perform deterministic rollout based on userId
    if (value && typeof value.percent === 'number' && value.percent > 0) {
      // If percent is 100, always return model
      if (value.percent >= 100) return value.model;
      // Hash userId (or anonymous) into 1..100
      const bucket = Math.abs(hashString(String(userId || 'anon')) % 100) + 1;
      if (bucket <= value.percent) return value.model;
      // fallback if provided, otherwise default model
      return value.model_fallback || 'claude-4-mini';
    }

    return value.model || 'claude-4-mini';
  } catch (err) {
    console.error('Error reading feature_flags ai:model', err);
    return process.env.AI_MODEL || 'claude-4-mini';
  }
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

module.exports = { getModelForRequest, hashString };
