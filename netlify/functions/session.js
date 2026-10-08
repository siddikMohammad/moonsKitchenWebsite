// Tells the browser who (if anyone) is signed in. The session cookie is
// HttpOnly, so page JS can't read it directly — the header calls this instead.
// Also hands the login page the public Google client ID (not a secret).

const { readSession, getSessionToken, json } = require("../lib/session");

exports.handler = async (event) => {
  const email = readSession(getSessionToken(event), process.env.SESSION_SECRET);
  return json(200, {
    loggedIn: !!email,
    email: email || null,
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  });
};
