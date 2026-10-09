// Verifies the OTP against the signed token from send-otp.js (no database),
// then issues a signed session cookie.
// Requires env vars: OTP_SECRET, SESSION_SECRET (set in Netlify site settings).

import crypto from "crypto";
import sessionLib from "../lib/session.js";
const { sessionCookie } = sessionLib;
import { getStore } from "@netlify/blobs";
import limits from "../lib/limits.js";
import v2Lib from "../lib/v2.js";

// Blocks guessing: after this many wrong codes for an email, codes for it are
// refused until the window passes (Google sign-in still works meanwhile).
const MAX_WRONG_CODES = 5;
const WRONG_CODE_WINDOW_MS = 15 * 60 * 1000;

function verifyOtpToken(email, otp, token, secret) {
  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return false;
  }
  // Token is "<email>.<expiry>.<sig>" and the email itself contains dots,
  // so split from the right.
  const sigDot = decoded.lastIndexOf(".");
  const expDot = decoded.lastIndexOf(".", sigDot - 1);
  if (sigDot < 0 || expDot < 0) return false;

  const tokenEmail = decoded.slice(0, expDot);
  const expiry = decoded.slice(expDot + 1, sigDot);
  const sig = decoded.slice(sigDot + 1);
  if (tokenEmail !== email) return false;
  if (Date.now() > Number(expiry)) return false;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${email}.${expiry}.${otp}`)
    .digest("hex");

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let email, otp, token, tokens;
  try {
    ({ email, otp, token, tokens } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // After "Resend OTP" the browser holds several tokens; a code from any of
  // the recent emails is accepted.
  tokens = (Array.isArray(tokens) ? tokens : [token]).filter(Boolean).slice(-5);

  email = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp || "") || !tokens.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }

  const otpSecret = process.env.OTP_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!otpSecret || !sessionSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "OTP service not configured" }) };
  }

  const store = limits.openStore(getStore);
  const failKey = limits.keyFor("email-fail", email);
  if (await limits.isBlocked(store, failKey, MAX_WRONG_CODES, WRONG_CODE_WINDOW_MS)) {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error: "Too many wrong codes. Please wait 15 minutes and request a new code, or continue with Google.",
      }),
    };
  }

  if (!tokens.some((t) => verifyOtpToken(email, otp, t, otpSecret))) {
    await limits.record(store, failKey, WRONG_CODE_WINDOW_MS);
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "That code didn't match or has expired. Check the latest email from Moon's Kitchen, or tap Resend OTP.",
      }),
    };
  }

  await limits.reset(store, failKey);

  return {
    statusCode: 200,
    headers: { "Set-Cookie": sessionCookie(email, sessionSecret), "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};

// v2 format so Netlify Blobs (rate limits) can read with strong consistency.
export default v2Lib.v2(handler);
