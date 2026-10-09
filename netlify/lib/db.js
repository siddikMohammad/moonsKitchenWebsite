// All database access goes through this file (Supabase REST API, plain
// fetch — no extra packages). To switch databases later, only this file
// needs rewriting.
//
// Requires env vars: SUPABASE_URL, SUPABASE_SECRET_KEY (secret).

function config() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || "";
  if (!url || !key) throw new DbError("Database not configured", 500);
  return { url, key };
}

class DbError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status || 502;
  }
}

function headers(key, extra) {
  const h = { apikey: key, "Content-Type": "application/json" };
  // New-style keys (sb_secret_...) go only in `apikey`; legacy service_role
  // JWTs also need the Authorization header.
  if (!key.startsWith("sb_")) h.Authorization = `Bearer ${key}`;
  return Object.assign(h, extra);
}

async function request(method, path, body, extraHeaders) {
  const { url, key } = config();
  let res;
  try {
    res = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers: headers(key, extraHeaders),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    console.error("db: network error:", err.message);
    throw new DbError("Could not reach the database");
  }
  const text = await res.text();
  if (!res.ok) {
    console.error(`db: ${method} ${path.split("?")[0]} -> ${res.status}: ${text.slice(0, 300)}`);
    throw new DbError("Database request failed");
  }
  return text ? JSON.parse(text) : null;
}

// Builds "col=op.value" filters with each value URL-encoded.
function filters(where) {
  return Object.entries(where || {})
    .map(([col, cond]) => {
      const [op, value] = Array.isArray(cond) ? cond : ["eq", cond];
      return `${encodeURIComponent(col)}=${op}.${encodeURIComponent(value)}`;
    })
    .join("&");
}

function select(table, { where, order, limit, columns } = {}) {
  const parts = [`select=${columns || "*"}`];
  const f = filters(where);
  if (f) parts.push(f);
  if (order) parts.push(`order=${order}`);
  if (limit) parts.push(`limit=${Number(limit)}`);
  return request("GET", `${table}?${parts.join("&")}`);
}

async function insert(table, row) {
  const rows = await request("POST", table, row, { Prefer: "return=representation" });
  return rows[0];
}

async function update(table, where, patch) {
  const rows = await request("PATCH", `${table}?${filters(where)}`, patch, { Prefer: "return=representation" });
  return rows[0] || null;
}

module.exports = { select, insert, update, DbError };
