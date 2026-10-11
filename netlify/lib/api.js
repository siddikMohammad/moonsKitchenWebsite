// Shared helpers for the order / review / admin functions.

const { readSession, getSessionToken } = require("./session");
const { DbError } = require("./db");

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// { email, isAdmin } for the signed-in visitor, or null.
function currentUser(event) {
  const email = readSession(getSessionToken(event), process.env.SESSION_SECRET);
  if (!email) return null;
  return { email, isAdmin: adminEmails().includes(email) };
}

function json(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) };
}

// State-changing requests must be JSON: a plain cross-site <form> can't send
// that, so this blocks CSRF on top of the SameSite cookie.
function readJsonBody(event) {
  const type = (event.headers["content-type"] || "").toLowerCase();
  if (!type.includes("application/json")) return null;
  try {
    const body = JSON.parse(event.body || "{}");
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

function cleanText(value, max) {
  if (value == null) return "";
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

// Turns unexpected errors into a JSON response instead of a crash.
function safe(handler) {
  return async (event) => {
    try {
      return await handler(event);
    } catch (err) {
      if (err instanceof DbError) return json(err.status, { error: "Something went wrong saving your data. Please try again." });
      console.error("api: unexpected error:", err);
      return json(500, { error: "Something went wrong. Please try again." });
    }
  };
}

module.exports = { currentUser, adminEmails, json, readJsonBody, cleanText, safe };
