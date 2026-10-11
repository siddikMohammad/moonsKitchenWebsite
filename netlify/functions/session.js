// Tells the browser who (if anyone) is signed in. The session cookie is
// HttpOnly, so page JS can't read it directly — the header calls this instead.
// Also hands the login page the public Google client ID (not a secret).

const { json } = require("../lib/session");
const { currentUser } = require("../lib/api");

exports.handler = async (event) => {
  const user = currentUser(event);
  return json(200, {
    loggedIn: !!user,
    email: user ? user.email : null,
    isAdmin: !!(user && user.isAdmin),
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  });
};
