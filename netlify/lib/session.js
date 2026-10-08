// Shared session-cookie helpers for the login functions.
// Kept outside netlify/functions/ so Netlify doesn't deploy it as a function;
// esbuild bundles it into each function that requires it.

const crypto = require("crypto");

// Customers stay signed in for 30 days, so they don't have to log in on every visit.
const SESSION_TTL_DAYS = 30;
const COOKIE_NAME = "mk_session";

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function signSession(email, secret) {
  const expiry = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${email}.${expiry}`;
  return Buffer.from(`${payload}.${sign(payload, secret)}`).toString("base64url");
}

// Returns the signed-in email, or null if the token is missing/invalid/expired.
function readSession(token, secret) {
  if (!token || !secret) return null;
  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
  // Email itself may contain dots, so split from the right.
  const sigDot = decoded.lastIndexOf(".");
  const expDot = decoded.lastIndexOf(".", sigDot - 1);
  if (sigDot < 0 || expDot < 0) return null;

  const email = decoded.slice(0, expDot);
  const expiry = decoded.slice(expDot + 1, sigDot);
  const sig = decoded.slice(sigDot + 1);
  if (Date.now() > Number(expiry)) return null;

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(sign(`${email}.${expiry}`, secret), "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return email;
}

function getSessionToken(event) {
  const header = (event.headers && (event.headers.cookie || event.headers.Cookie)) || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

function sessionCookie(email, secret) {
  return [
    `${COOKIE_NAME}=${signSession(email, secret)}`,
    "Path=/",
    `Max-Age=${SESSION_TTL_DAYS * 24 * 60 * 60}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function json(statusCode, body, headers) {
  return {
    statusCode,
    headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, headers),
    body: JSON.stringify(body),
  };
}

module.exports = { sessionCookie, clearedCookie, readSession, getSessionToken, json };
