// Verifies the OTP against the signed token from send-otp.js (no database),
// then issues a signed session cookie.
// Requires env vars: OTP_SECRET, SESSION_SECRET (set in Netlify site settings).

const crypto = require("crypto");
const { sessionCookie } = require("../lib/session");

function verifyOtpToken(email, otp, token, secret) {
  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const parts = decoded.split(".");
  if (parts.length !== 3) return false;

  const [tokenEmail, expiry, sig] = parts;
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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let email, otp, token;
  try {
    ({ email, otp, token } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  email = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp || "") || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }

  const otpSecret = process.env.OTP_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!otpSecret || !sessionSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "OTP service not configured" }) };
  }

  if (!verifyOtpToken(email, otp, token, otpSecret)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect or expired OTP" }) };
  }

  return {
    statusCode: 200,
    headers: { "Set-Cookie": sessionCookie(email, sessionSecret), "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
