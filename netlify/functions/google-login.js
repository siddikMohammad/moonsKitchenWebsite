// "Continue with Google" — verifies the Google ID token the browser got from
// Google Identity Services, then issues the same session cookie as OTP login.
// Requires env vars: GOOGLE_CLIENT_ID, SESSION_SECRET.

const { sessionCookie, json } = require("../lib/session");

const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let credential;
  try {
    ({ credential } = JSON.parse(event.body || "{}"));
  } catch {
    return json(400, { error: "Invalid request body" });
  }
  if (!credential) return json(400, { error: "Missing Google credential" });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!clientId || !sessionSecret) {
    return json(500, { error: "Google sign-in not configured" });
  }

  // Google's tokeninfo endpoint checks the token's signature and expiry for us.
  let info;
  try {
    const res = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential)
    );
    if (!res.ok) return json(401, { error: "Google sign-in failed. Please try again." });
    info = await res.json();
  } catch {
    return json(502, { error: "Could not reach Google" });
  }

  if (
    info.aud !== clientId ||
    !GOOGLE_ISSUERS.includes(info.iss) ||
    String(info.email_verified) !== "true" ||
    !info.email
  ) {
    return json(401, { error: "Google sign-in failed. Please try again." });
  }

  const email = info.email.trim().toLowerCase();
  return json(200, { ok: true, email: email }, { "Set-Cookie": sessionCookie(email, sessionSecret) });
};
