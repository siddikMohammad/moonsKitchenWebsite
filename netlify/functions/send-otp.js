// Generates an OTP, emails it via Brevo, and returns a signed verification
// token. The OTP itself is never sent back to the browser — only a keyed
// HMAC of it — so no database is needed and the client can't read the code.
//
// Requires env vars: BREVO_API_KEY, BREVO_SENDER_EMAIL, OTP_SECRET
// (set in Netlify site settings).

const crypto = require("crypto");

const OTP_TTL_MINUTES = 10;

function makeOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function signOtpToken(email, otp, secret) {
  const expiry = Date.now() + OTP_TTL_MINUTES * 60 * 1000;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${email}.${expiry}.${otp}`)
    .digest("hex");
  return Buffer.from(`${email}.${expiry}.${sig}`).toString("base64url");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  email = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Enter a valid email address" }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const otpSecret = process.env.OTP_SECRET;
  if (!apiKey || !senderEmail || !otpSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "OTP service not configured" }) };
  }

  const otp = makeOtp();
  const token = signOtpToken(email, otp, otpSecret);

  let res;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Moon's Kitchen", email: senderEmail },
        to: [{ email: email }],
        subject: "Your Moon's Kitchen verification code",
        htmlContent:
          `<p>Your verification code is:</p>` +
          `<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>` +
          `<p>This code expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>`,
      }),
    });
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach email service" }) };
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return {
      statusCode: 502,
      body: JSON.stringify({ error: errData.message || "Failed to send OTP email" }),
    };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, token: token }) };
};
