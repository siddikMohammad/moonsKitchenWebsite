// Rate limits for the email-code login, stored in Netlify Blobs (free,
// built into Netlify — no database to set up).
//
// Emails and IPs are stored only as hashes. If Blobs is unreachable the
// limits are skipped (logged) rather than locking everyone out of login.

const crypto = require("crypto");

const STORE_NAME = "login-limits";

// Must be called from a v2 function (see lib/v2.js); Netlify configures
// Blobs for those automatically. `getStore` is passed in from the function
// file because Netlify only bundles @netlify/blobs when imported there.
function openStore(getStore) {
  try {
    // Strong consistency: the default ("eventual") can serve counts up to a
    // minute old, which would let rapid guesses slip past the limit.
    return getStore({ name: STORE_NAME, consistency: "strong" });
  } catch (err) {
    console.error("limits: Blobs unavailable, skipping limits:", err.message);
    return null;
  }
}

function keyFor(kind, value) {
  return kind + "-" + crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 40);
}

async function recentHits(store, key, windowMs) {
  const data = await store.get(key, { type: "json" });
  const now = Date.now();
  return ((data && data.t) || []).filter((t) => now - t < windowMs);
}

// Counts a hit if under the limit. Returns false when the limit is reached.
async function allow(store, key, limit, windowMs) {
  if (!store) return true;
  try {
    const hits = await recentHits(store, key, windowMs);
    if (hits.length >= limit) return false;
    hits.push(Date.now());
    await store.setJSON(key, { t: hits });
    return true;
  } catch (err) {
    console.error("limits: check failed, allowing:", err.message);
    return true;
  }
}

// True when the number of recorded hits has reached the limit (doesn't add one).
async function isBlocked(store, key, limit, windowMs) {
  if (!store) return false;
  try {
    return (await recentHits(store, key, windowMs)).length >= limit;
  } catch (err) {
    console.error("limits: check failed, allowing:", err.message);
    return false;
  }
}

async function record(store, key, windowMs) {
  if (!store) return;
  try {
    const hits = await recentHits(store, key, windowMs);
    hits.push(Date.now());
    await store.setJSON(key, { t: hits });
  } catch (err) {
    console.error("limits: record failed:", err.message);
  }
}

async function reset(store, key) {
  if (!store) return;
  try {
    await store.delete(key);
  } catch (err) {
    console.error("limits: reset failed:", err.message);
  }
}

function clientIp(event) {
  const h = event.headers || {};
  return h["x-nf-client-connection-ip"] || (h["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
}

module.exports = { openStore, keyFor, allow, isBlocked, record, reset, clientIp };
