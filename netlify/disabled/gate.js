// Runs on every request. Redirects to /login.html unless a valid,
// unexpired session cookie (set by verify-otp.js) is present.

const ALLOW_PREFIXES = [
  "/login",
  "/.netlify/functions/",
  "/css/",
  "/js/",
  "/assets/",
];
const ALLOW_EXACT = ["/favicon.ico"];

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (ALLOW_EXACT.includes(path) || ALLOW_PREFIXES.some((p) => path.startsWith(p))) {
    return context.next();
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/mk_session=([^;]+)/);

  if (match && (await isValidSession(match[1]))) {
    return context.next();
  }

  return Response.redirect(new URL("/login.html", url), 302);
};

async function isValidSession(token) {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const decoded = atob(padded);
    const parts = decoded.split(".");
    if (parts.length !== 3) return false;

    const [identifier, expiry, sig] = parts;
    if (Date.now() > Number(expiry)) return false;

    const secret = Deno.env.get("SESSION_SECRET");
    if (!secret) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${identifier}.${expiry}`)
    );
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSig === sig;
  } catch {
    return false;
  }
}

export const config = { path: "/*" };
